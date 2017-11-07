package com.directv.hw.hadoop.hdfs

import akka.stream.scaladsl.Source
import akka.util.ByteString
import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.core.exception.ServiceNotFoundException
import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.config.{ClusterServiceNames, ClusterServiceResolver}
import com.directv.hw.hadoop.hdfs.model.HdfsFileStatus
import com.directv.hw.hadoop.http.client.{BadResponseException, ConnectionException, ServiceCredentials}
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.persistence.dao.ClusterServiceDao
import com.directv.hw.persistence.entity.ClusterServiceEntity
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}

import scala.concurrent.duration._
import scala.concurrent.{Await, ExecutionContext, Future}
import scala.language.postfixOps

class HdfsServiceImpl(clusterPath: ClusterPath, credentials: ServiceCredentials)
                     (implicit injector: Injector) extends HdfsService with Injectable with LazyLogging {

  private val clusterServiceDao = inject[ClusterServiceDao]
  private val appConf = inject[AppConf]
  private val dispatcherFactory = inject[DispatcherFactory]
  private val client = HdfsClient(credentials)
  private val serviceResolver = inject[ClusterServiceResolver]

  implicit val dispatcher: ExecutionContext = dispatcherFactory.dispatcher

  override def getTextFile(path: String, offset: Option[Long], length: Option[Long]): String = {
    new String(await(withRetry(client.getFileContent(resolveUrl(clusterPath), path, offset, length))))
  }

  override def tryTextFile(path: String, offset: Option[Long], length: Option[Long]): Option[String] = {
    try {
      Some(new String(await(withRetry(client.getFileContent(resolveUrl(clusterPath), path, offset, length)))))
    } catch {
      case BadResponseException(code, _) if code == 404 => None
    }
  }

  override def getBinaryFile(path: String, offset: Option[Long], length: Option[Long]): Array[Byte] = {
    await(withRetry(client.getFileContent(resolveUrl(clusterPath), path, offset, length)))
  }

  override def createFile(path: String, content: Array[Byte],
                          overwrite: Option[Boolean],
                          permission: Option[Int],
                          blocksize: Option[Long],
                          replication: Option[Short]): Unit = {

    await(withRetry(client.createFile(resolveUrl(clusterPath), path, content, overwrite, permission, blocksize, replication)))
  }

  override def downloadFile(path: String, offset: Option[Long], length: Option[Long]): Source[ByteString, _] = {
    await(withRetry(client.downloadFile(resolveUrl(clusterPath), path)))
  }

  override def uploadFile(path: String, content: Source[ByteString, _],
                          overwrite: Option[Boolean],
                          permission: Option[Int],
                          blocksize: Option[Long],
                          replication: Option[Short]): Unit = {

    await(withRetry(client.uploadFile(resolveUrl(clusterPath), path, content, overwrite, permission, blocksize, replication)))
  }

  override def makeDirs(path: String, permission: Option[Int]): Boolean = {
    await(withRetry(client.makeDirs(resolveUrl(clusterPath), path, permission)))
  }

  override def rename(path: String, destination: String): Boolean = {
    await(withRetry(client.rename(resolveUrl(clusterPath), path, destination)))
  }

  override def delete(path: String, recursive: Option[Boolean]): Boolean = {
    await(withRetry(client.delete(resolveUrl(clusterPath), path, recursive)))
  }

  override def appendToFile(path: String, content: Array[Byte]): Unit = {
    await(withRetry(client.appendToFile(resolveUrl(clusterPath), path, content)))
  }

  override def setPermission(path: String, permission: Option[Int]): Unit = {
    await(withRetry(client.setPermission(resolveUrl(clusterPath), path, permission)))
  }

  override def setOwner(path: String, owner: Option[String], group: Option[String]): Unit = {
    await(withRetry(client.setOwner(resolveUrl(clusterPath), path, owner, group)))
  }

  override def setFileTimes(path: String, access: Option[Long], modification: Option[Long]): Unit = {
    await(withRetry(client.setFileTimes(resolveUrl(clusterPath), path, access, modification)))
  }

  override def listFiles(path: String): List[HdfsFileStatus] = {
    await(withRetry(client.listFiles(resolveUrl(clusterPath), path)))
  }

  override def fileStatus(path: String): HdfsFileStatus = {
    await(withRetry(client.fileStatus(resolveUrl(clusterPath), path)))
  }

  private def await[T](operation: Future[T]): T = {
    Await.result(operation, appConf.outgoingHttpRqTimeoutMs * 2 millis)
  }

  private def resolveUrl(clusterPath: ClusterPath): String = {
    clusterServiceDao.findService(clusterPath, ClusterServiceNames.nameNode).map(_.url).getOrElse {
      throw ServiceNotFoundException("Couldn't resolve namenode URL")
    }
  }

  private def withRetry[T](op: => Future[T]): Future[T] = {
    op.recoverWith {
      case e@BadResponseException(code, _) if code == 403 => tryNodes(op, e)
      case e@ConnectionException(_, _) => tryNodes(op, e)
      case e => Future(throw e)
    }
  }

  private def tryNodes[T](op: => Future[T], e: Throwable): Future[T] = {
    logger.warn(s"Cached namenode is not available trying to resolve active node")
    val nodes = serviceResolver.resolveNamenodes(clusterPath)
    nodeAttempt(nodes, op, e)
  }

  private def nodeAttempt[T](nodes: List[String], op: => Future[T], prev: Throwable): Future[T] = {
    nodes match {
      case node :: tail =>
        clusterServiceDao.saveService {
          ClusterServiceEntity (
            clusterPath.platformId,
            clusterPath.clusterId,
            ClusterServiceNames.nameNode,
            node
          )
        }

        op.recoverWith {
          case e@BadResponseException(code, _) if code == 403 => nodeAttempt(tail, op, e)
          case e@ConnectionException(_, _) => nodeAttempt(tail, op, e)
          case e => Future(throw e)
        }

      case Nil => Future(throw prev)
    }
  }
}
