package com.directv.hw.core.service

import java.io._
import java.nio.file.{Files, Path, Paths}
import com.directv.hw.common.io.DapIoUtils
import com.directv.hw.common.io.DapIoUtils._
import com.directv.hw.core.exception.{DapException, ErrorTypeAlreadyExists}
import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.files.exception.NotFoundException
import com.directv.hw.hadoop.model.{ModuleFile, ModulePath}
import org.apache.commons.io.{FileUtils, IOUtils}
import scala.collection.JavaConverters._

class ComponentLocalFS(dir: File) extends ComponentFS {

  def this(dir: String) = {
    this(new File(dir))
  }

  override def listFiles(from: String, includeDirectories: Boolean, depth: Int): List[ModuleFile] = {
    DapIoUtils.collectModuleFiles(toFile(from), from, depth, includeDirectories)
  }

  override def getLocalFile(file: String): File = {
    toFile(file)
  }

  override def readFile(file: String): InputStream = {
    val absFile = toFile(file)
    if (!absFile.exists() || absFile.isDirectory) {
      throw new NotFoundException(s"${dir.getAbsolutePath}/$file")
    }

    new FileInputStream(absFile)
  }

  override def getFileContent(file: String): String = {
    readText(file)
  }

  private def readText(file: String) = {
    managed2(readFile(file)) { is =>
      IOUtils.readLines(is, defaultCharset).asScala.mkString("\n")
    }
  }

  override def tryFileContent(path: String): Option[String] = {
    if (Files.exists(Paths.get(dir.toURI).resolve(path))) {
      Some(readText(path))
    } else {
      None
    }

  }

  override def writeFile(file: String, is: InputStream, overwrite: Overwrite): Unit = {
    writeOperation(file, overwrite) { f =>
      ensureDirExists(f.getParentFile)
      managed2(new FileOutputStream(f)) { os =>
        managed2(is) { is =>
          IOUtils.copy(is, os)
        }
      }
    }
  }

  override def saveFileContent(file: String, content: String, overwrite: Overwrite): Unit = {
    writeFile(file, new ByteArrayInputStream(content.getBytes(defaultCharset)), overwrite)
  }

  override def createDir(dir: String): Unit = {
    ensureDirExists(toFile(dir))
  }

  override def move(file: String, to: String, overwrite: Overwrite): Unit = {
    writeOperation(to, overwrite) { f =>
      toFile(file).renameTo(f)
    }
  }

  override def delete(file: String): Unit = {
    toFile(file) match {
      case f if f.isFile =>
        f.delete()
      case d if d.isDirectory =>
        FileUtils.deleteDirectory(d)
    }
  }

  protected def toFile(file: String): File = {
    if(file == ComponentFS.root) dir else new File(dir, file)
  }

  private def writeOperation[T](file: String, overwrite: Overwrite)(operation: File => T): T = {
    val f = toFile(file)
    overwrite match {
      case Overwrite.FAIL_ON_EXISTING if f.exists() =>
        throw new DapException(s"File $file already exists", errorType = Some(ErrorTypeAlreadyExists))
      case _ =>
        operation(f)
    }
  }

  override def createBaseDir(): Boolean = dir.createNewFile()
}