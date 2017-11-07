package com.directv.hw.hadoop.oozie.file

import java.io.{ByteArrayInputStream, InputStream}

import akka.stream.scaladsl.StreamConverters
import com.directv.hw.common.io.DapIoUtils
import com.directv.hw.core.exception.DapException
import com.directv.hw.core.service.{AppConf, Overwrite}
import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.hdfs.HdfsServiceFactory
import com.directv.hw.hadoop.hdfs.exception.HdfsFileNotFoundException
import com.directv.hw.hadoop.hdfs.model.{HdfsFileStatus, HdfsFileTypes}
import com.directv.hw.hadoop.model.{ClusterPath, ModuleFile, ModuleFileCommon}
import com.directv.hw.persistence.dao.OozieWorkflowDao
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}

import scala.util.Try

object OozieComponentHDFS {
  def apply(clusterPath: ClusterPath, appPath: String, userName: String)(implicit injector: Injector): ComponentFS = {
    OozieComponentFS(new OozieComponentHDFS(clusterPath, appPath, userName))
  }
}

private class OozieComponentHDFS(clusterPath: ClusterPath, appPath: String, user: String)
                        (implicit injector: Injector) extends ComponentFS with Injectable with LazyLogging{

  private val deploymentDao = inject[OozieWorkflowDao]
  private val appConf = inject[AppConf]
  private val deployment = deploymentDao.getWorkflow(clusterPath, appPath)
  private val team = deployment.team.getOrElse(appConf.defaultTeam)
  private val hdfs = inject[HdfsServiceFactory].byTeam(clusterPath, team)

  override def listFiles(from: String, includeDirectories: Boolean, depth: Int): List[ModuleFile] = {
    val fromStatus = hdfs.fileStatus(DapIoUtils.concat(appPath, from))
    collectModuleFiles(fromStatus, from, depth, includeDirectories)
  }

  override def createBaseDir(): Boolean = {
    hdfs.makeDirs(appPath)
  }

  private def collectModuleFiles(from: HdfsFileStatus, prefix: String, depth: Int, includeDirectories: Boolean): List[ModuleFile] = {
    if(from.`type` == HdfsFileTypes.file) {
      List(ModuleFile(prefix, ModuleFileCommon.file, from.length))
    } else if(from.`type` == HdfsFileTypes.directory) {
      val list = if(includeDirectories && prefix.nonEmpty) List(ModuleFile(prefix, ModuleFileCommon.dir, 0)) else List.empty
      if(depth != 0) {
        val statuses = try {
          hdfs.listFiles(DapIoUtils.concat(appPath, prefix))
        } catch {
          case _: HdfsFileNotFoundException => List.empty
          case e: Throwable => throw e
        }

        val children = statuses flatMap { status =>
          collectModuleFiles(status, DapIoUtils.concat(prefix, status.pathSuffix), if (depth > 0) depth - 1 else depth, includeDirectories)
        }
        children ++ list
      } else list
    } else {
      List.empty
    }
  }

  override def getFileContent(file: String): String = {
    hdfs.getTextFile(fullPath(file))
  }

  override def saveFileContent(file: String, content: String, overwrite: Overwrite): Unit = {
    val path = fullPath(file)
    hdfs.createFile(path, content.getBytes)
  }

  override def writeFile(file: String, is: InputStream, overwrite: Overwrite): Unit = {
    val path = fullPath(file)
    val start = System.currentTimeMillis()
    val in = StreamConverters.fromInputStream(() => is)
    hdfs.uploadFile(path, in)
    logger.debug(s"write file to HDFS $path - ${System.currentTimeMillis() - start} ms")
  }

  override def readFile(file: String): InputStream = {
    val content = hdfs.getBinaryFile(fullPath(file))
    new ByteArrayInputStream(content)
  }

  override def createDir(dir: String): Unit = {
    hdfs.makeDirs(fullPath(dir))
  }

  override def move(file: String, to: String, overwrite: Overwrite = Overwrite.OVERWRITE): Unit = {
    hdfs.rename(fullPath(file), fullPath(to))
  }

  override def delete(file: String): Unit = {
    hdfs.delete(fullPath(file))
  }

  private def fullPath(file: String) = {
    if (file startsWith "//"){
      val absPath = file.substring(1)
      if (absPath startsWith appPath) {
        absPath
      } else {
        throw new DapException(s"HDFS path [$absPath] not under workflow root [$appPath]")
      }
    } else {
      DapIoUtils.concat(appPath, file)
    }
  }

  override def tryFileContent(path: String): Option[String] = {
    hdfs.tryTextFile(fullPath(path))
  }
}
