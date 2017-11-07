package com.directv.hw.hadoop.hdfs

import akka.http.scaladsl.model.{StatusCodes, _}
import akka.stream.scaladsl.Source
import akka.util.ByteString
import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.hadoop.hdfs.model.HdfsFileStatus
import com.directv.hw.hadoop.hdfs.response.{BooleanResult, FileStatusResp, FileStatusesResp}
import com.directv.hw.hadoop.http.client._
import scaldi.{Injectable, Injector}
import spray.json.{JsonParser, JsonReader, _}

import scala.concurrent.{ExecutionContext, Future}
import scala.util.{Failure, Success}

trait HdfsClient {

  def getFileContent(namenode: String,
                     path: String,
                     offset: Option[Long] = None,
                     length: Option[Long] = None): Future[Array[Byte]]

  def createFile(namenode: String,
                 path: String,
                 content: Array[Byte],
                 overwrite: Option[Boolean] = None,
                 permission: Option[Int] = None,
                 blocksize: Option[Long] = None,
                 replication: Option[Short] = None): Future[Unit]

  def downloadFile(namenode: String, path: String): Future[Source[ByteString, _]]

  def uploadFile(namenode: String,
                 path: String,
                 content: Source[ByteString, _],
                 overwrite: Option[Boolean] = None,
                 permission: Option[Int] = None,
                 blocksize: Option[Long] = None,
                 replication: Option[Short] = None): Future[Unit]

  def makeDirs(namenode: String, path: String, permission: Option[Int]): Future[Boolean]
  def rename(namenode: String, path: String, destination: String): Future[Boolean]
  def delete(namenode: String, path: String, recursive: Option[Boolean] = Some(true)): Future[Boolean]
  def appendToFile(namenode: String, path: String, content: Array[Byte]): Future[Unit]
  def setPermission(namenode: String, path: String, permission: Option[Int]): Future[Unit]
  def setOwner(namenode: String, path: String,
               owner: Option[String] = None,
               group: Option[String] = None): Future[Unit]

  def setFileTimes(namenode: String, path: String,
                   access: Option[Long] = None,
                   modification: Option[Long] = None): Future[Unit]

  def listFiles(namenode: String, path: String): Future[List[HdfsFileStatus]]
  def fileStatus(namenode: String, path: String): Future[HdfsFileStatus]
}

object HdfsClient {
  def apply(credentials: ServiceCredentials)(implicit injector: Injector): HdfsClient = {
    new HdfsClientImpl(credentials)
  }
}


class HdfsClientImpl(credentials: ServiceCredentials)(implicit injector: Injector)
  extends HdfsClient with Injectable with HdfsJsonFormats {

  val (simpleCredentials, krbCredentials) = credentials match {
    case creds: KrbCredentials => None -> Some(creds)
    case creds: SimpleCredentials => Some(creds) -> None
  }

  private val userParam = simpleCredentials.map("user.name=" + _.user)
  private val apiContext = "webhdfs/v1"
  private val http = inject[HttpDispatcher]
  private val dispatcherFactory = inject[DispatcherFactory]

  private implicit val dispatcher: ExecutionContext = dispatcherFactory.dispatcher

  override def getFileContent(namenode: String,
                              path: String,
                              offset: Option[Long],
                              length: Option[Long]): Future[Array[Byte]] = {

    val offsetParam = offset.map("offset=" + _)
    val lengthParam = length.map("length=" + _)
    val params = opParam("OPEN") :: List(offsetParam, lengthParam, userParam).flatten
    val url = apiUrl(namenode) + normalPath(path) + "?" + params.mkString("&")
    http.submitRequestWithRedirect(HttpMethods.GET, url, credentials = krbCredentials).map {
      case Success(resp) =>
        if (resp.status != StatusCodes.OK) throw BadResponseException(resp.status.intValue(), new String(resp.body))
        else resp.body
      case Failure(e) => throw e
    }
  }

  override def appendToFile(namenode: String,
                            path: String,
                            content: Array[Byte]): Future[Unit] = {

    val params = opParam("APPEND") :: List(userParam).flatten
    val url = apiUrl(namenode) + normalPath(path) + "?" + params.mkString("&")
    val entity = HttpEntity(ContentTypes.`application/octet-stream`, content)
    http.submitRequestWithRedirect(HttpMethods.POST, url, body = entity, credentials = krbCredentials).map {
      case Success(resp) =>
        if (resp.status != StatusCodes.OK) throw BadResponseException(resp.status.intValue(), new String(resp.body))
        else Unit
      case Failure(e) => throw e
    }
  }

  override def createFile(namenode: String,
                          path: String, content: Array[Byte],
                          overwrite: Option[Boolean],
                          permission: Option[Int],
                          blocksize: Option[Long],
                          replication: Option[Short]): Future[Unit] = {

    val entity = HttpEntity(ContentTypes.`application/octet-stream`, content)
    createFileOperation(namenode, path, overwrite, permission, blocksize, replication, entity)
  }

  override def downloadFile(namenode: String, path: String): Future[Source[ByteString, _]] = {
    val params = opParam("OPEN") :: List(userParam).flatten
    val url = apiUrl(namenode) + normalPath(path) + "?" + params.mkString("&")
    http.submitStreamRequestWithRedirect(HttpMethods.GET, url, credentials = krbCredentials).map {
      case Success(resp) =>
        if (resp.status != StatusCodes.OK) throw BadResponseException(resp.status.intValue(), "Couldn't download file")
        else resp.body
      case Failure(e) => throw e
    }
  }

  private def createFileOperation(namenode: String,
                                  path: String,
                                  overwrite: Option[Boolean],
                                  permission: Option[Int],
                                  blocksize: Option[Long],
                                  replication: Option[Short],
                                  entity: RequestEntity): Future[Unit] = {

    val overwriteParam = overwrite.map("overwrite=" + _)
    val permissionParam = permission.map("permission=" + _)
    val blocksizeParam = blocksize.map("blocksize=" + _)
    val replicationParam = replication.map("replication=" + _)
    val optParams = List(overwriteParam, permissionParam, blocksizeParam, replicationParam, userParam)
    val params = opParam("CREATE") :: optParams.flatten
    val url = apiUrl(namenode) + normalPath(path) + "?" + params.mkString("&")
    http.submitRequestWithRedirect(HttpMethods.PUT, url, body = entity, credentials = krbCredentials).map {
      case Success(resp) =>
        if (resp.status != StatusCodes.Created) throw BadResponseException(resp.status.intValue(), new String(resp.body))
        else Unit
      case Failure(e) => throw e
    }
  }

  override def uploadFile(namenode: String, path: String,
                          content: Source[ByteString, _],
                          overwrite: Option[Boolean],
                          permission: Option[Int],
                          blocksize: Option[Long],
                          replication: Option[Short]): Future[Unit] = {

    val entity = HttpEntity(ContentTypes.`application/octet-stream`, content)
    createFileOperation(namenode, path, overwrite, permission, blocksize, replication, entity)
  }

  override def makeDirs(namenode: String,
                        path: String,
                        permission: Option[Int]): Future[Boolean] = {

    val permissionParam = permission.map("permission=" + _)
    val params = opParam("MKDIRS") :: List(permissionParam, userParam).flatten
    val url = apiUrl(namenode) + normalPath(path) + "?" + params.mkString("&")
    http.submitRequest(HttpMethods.PUT, url, credentials = krbCredentials).map {
      case Success(resp) =>
        if (resp.status != StatusCodes.OK) {
          throw BadResponseException(resp.status.intValue(), new String(resp.body))
        } else {
          convertBody[BooleanResult](resp.body).boolean
        }

      case Failure(e) => throw e
    }
  }

  override def rename(namenode: String,
                      path: String,
                      destination: String): Future[Boolean] = {
    val destParam = "destination=" + normalPath(destination)
    val params = List(opParam("RENAME"), destParam) ::: List(userParam).flatten
    val url = apiUrl(namenode) + normalPath(path) + "?" + params.mkString("&")
    http.submitRequest(HttpMethods.PUT, url, credentials = krbCredentials).map {
      case Success(resp) =>
        if (resp.status != StatusCodes.OK) {
          throw BadResponseException(resp.status.intValue(), new String(resp.body))
        } else {
          convertBody[BooleanResult](resp.body).boolean
        }

      case Failure(e) => throw e
    }
  }

  override def delete(namenode: String,
                      path: String,
                      recursive: Option[Boolean]): Future[Boolean] = {
    val recursiveParam = recursive.map("recursive=" + _)
    val params = opParam("DELETE") :: List(recursiveParam, userParam).flatten
    val url = apiUrl(namenode) + normalPath(path) + "?" + params.mkString("&")
    http.submitRequest(HttpMethods.DELETE, url, credentials = krbCredentials).map {
      case Success(resp) =>
        if (resp.status == StatusCodes.OK) convertBody[BooleanResult](resp.body).boolean
        else throw BadResponseException(resp.status.intValue(), new String(resp.body))

      case Failure(e) => throw e
    }
  }

  override def setOwner(namenode: String, path: String,
                        owner: Option[String],
                        group: Option[String]): Future[Unit] = {

    val ownerParam = owner.map("owner=" + _)
    val groupParam = group.map("group=" + _)
    val params = opParam("SETOWNER") :: List(ownerParam, groupParam, userParam).flatten
    val url = apiUrl(namenode) + normalPath(path) + "?" + params.mkString("&")
    http.submitRequest(HttpMethods.PUT, url, credentials = krbCredentials).map {
      case Success(resp) =>
        if (resp.status == StatusCodes.OK) Unit
        else throw BadResponseException(resp.status.intValue(), new String(resp.body))
      case Failure(e) => throw e
    }
  }

  override def setPermission(namenode: String,
                             path: String,
                             permission: Option[Int]): Future[Unit] = {

    val permissionParam = permission.map("permission=" + _)
    val params = opParam("SETPERMISSION") :: List(permissionParam, userParam).flatten
    val url = apiUrl(namenode) + normalPath(path) + "?" + params.mkString("&")
    http.submitRequest(HttpMethods.PUT, url, credentials = krbCredentials).map {
      case Success(resp) =>
        if (resp.status == StatusCodes.OK) Unit
        else throw BadResponseException(resp.status.intValue(), new String(resp.body))
      case Failure(e) => throw e
    }
  }

  override def setFileTimes(namenode: String, path: String,
                            access: Option[Long],
                            modification: Option[Long]): Future[Unit] = {

    val accessParam = access.map("accesstime=" + _)
    val modificationParam = modification.map("modificationtime=" + _)
    val params = opParam("SETTIMES") :: List(accessParam, modificationParam, userParam).flatten
    val url = apiUrl(namenode) + normalPath(path) + "?" + params.mkString("&")
    http.submitRequest(HttpMethods.PUT, url, credentials = krbCredentials).map {
      case Success(resp) =>
        if (resp.status == StatusCodes.OK) Unit
        else throw BadResponseException(resp.status.intValue(), new String(resp.body))
      case Failure(e) => throw e
    }
  }

  override def listFiles(namenode: String,
                         path: String): Future[List[HdfsFileStatus]] = {

    val params = opParam("LISTSTATUS") :: List(userParam).flatten
    val url = apiUrl(namenode) + normalPath(path) + "?" + params.mkString("&")
    http.submitRequest(HttpMethods.GET, url, credentials = krbCredentials).map {
      case Success(resp) =>
        if (resp.status == StatusCodes.OK) {
          convertBody[FileStatusesResp](resp.body).FileStatuses.FileStatus
        } else {
          throw BadResponseException(resp.status.intValue(), new String(resp.body))
        }
      case Failure(e) => throw e
    }
  }

  override def fileStatus(namenode: String, path: String): Future[HdfsFileStatus] = {
    val params = opParam("GETFILESTATUS") :: List(userParam).flatten
    val url = apiUrl(namenode) + normalPath(path) + "?" + params.mkString("&")
    http.submitRequest(HttpMethods.GET, url, credentials = krbCredentials).map {
      case Success(resp) =>
        if (resp.status == StatusCodes.OK) {
          convertBody[FileStatusResp](resp.body).FileStatus
        } else {
          throw BadResponseException(resp.status.intValue(), new String(resp.body))
        }
      case Failure(e) => throw e
    }
  }

  private def apiUrl(url: String) = s"$url/$apiContext"
  private def normalPath(path: String) = ("/" + path.replaceAll("/+", "/")).replace("//", "/")
  private def opParam(operation: String) = s"op=$operation"


  private def convertBody[T: JsonReader](body: Array[Byte]): T = {
    try {
      val text = new String(body)
      if (text.isEmpty) throw UnknownResponseException("Empty incoming HTTP response")
      else text.parseJson.convertTo[T]
    } catch {
      case _: JsonParser.ParsingException => throw UnknownResponseException("Unknown incoming HTTP response - " + body)
    }
  }
}
