package com.directv.hw.web.hdfs.plugin

import akka.stream.scaladsl.StreamConverters
import com.directv.hw.common.web.{StreamEntity, WebCommon}
import com.directv.hw.core.auth.UserSecurityContext
import com.directv.hw.core.exception.{DapException, ServerError}
import com.directv.hw.core.http.RequestIdGenerator
import com.directv.hw.core.plugin.web.WebExtension
import com.directv.hw.hadoop.access.AccessManagerService
import com.directv.hw.hadoop.hdfs.{HdfsService, HdfsServiceFactory}
import com.directv.hw.hadoop.hdfs.model.{HdfsFileStatus, HdfsFileTypes}
import com.directv.hw.hadoop.model.PathCommon._
import com.directv.hw.hadoop.model._
import com.directv.hw.web.hdfs.di.HdfsModule
import com.directv.hw.web.hdfs.model._
import com.typesafe.scalalogging.LazyLogging
import ro.fortsoft.pf4j.{Extension, Plugin, PluginDescriptor, PluginWrapper}
import scaldi.{Injectable, Injector}
import spray.http.StatusCodes
import spray.routing.Route

import scala.language.postfixOps
import scala.util.{Failure, Success, Try}

class HdfsWebPlugin(pluginWrapper: PluginWrapper) extends Plugin(pluginWrapper)

@Extension
class HdfsWebExtension(implicit injector: Injector) extends WebExtension with WebCommon with HdfsJsonFormats with Injectable with LazyLogging {
  implicit val context: HdfsModule = new HdfsModule()(injector)

  private val pluginInfo = inject[PluginDescriptor]
  private val accessManager = inject[AccessManagerService]
  private val hdfsFactory = inject[HdfsServiceFactory]

  override def route: UserSecurityContext => Route = { userContext: UserSecurityContext =>
    pathPrefix(pluginInfo.getPluginId) {
      pathPrefix("api") {
        pathPrefix("v1.0") {
          pathPrefix("platforms" / IntNumber) { platformId =>
            pathPrefix("clusters" / Segment) { clusterId =>
              pathPrefix("services" / Segment) { serviceId =>
                val servicePath = new ServicePath(platformId, clusterId, serviceId)
                parameter('userId.?) { userIdParam =>
                  val userId = userIdParam.map(_.toInt)
                  pathPrefix("path") {
                    pathRoute(servicePath, userContext.user, userId)
                  } ~
                  pathPrefix("batch") {
                    batchRoute(servicePath, userContext.user, userId)
                  }
                } ~
                pathPrefix("currentUser") {
                  complete(WebHdfsUser(None, userContext.user))
                }
              } ~
              path("users") {
                get {
                  complete(clusterUsers(userContext.user, platformId, clusterId))
                }
              }
            }
          }
        }
      }
    }
  }

  private def clusterUsers(userName: String, platformId: Int, clusterId: String): WebHdfsUsers = {
    val privateUsers = accessManager.findSrvUsers(Some(platformId), Some(clusterId), Some(userName))
    val clusterUsers = accessManager.findSrvUsers(Some(platformId), Some(clusterId))
    val users = (privateUsers ::: clusterUsers).map(u => WebHdfsUser(u.id, u.name, u.homePath, u.team))
    WebHdfsUsers(users)
  }

  private def pathRoute(clusterPath: ClusterPath, userName: String, srvUserId: Option[Int]): Route = {
    lazy val hdfs = hdfsFactory.byUserId(clusterPath, srvUserId, userName)

    pathPrefix(Rest) { urlPath =>
      val path = normalizePath(decode(urlPath))
      parameter('overwrite.as[Boolean]? true) { overwrite =>
        get {
          operationRoute {
            case "read" =>
              parameter('offset.as[Long]?, 'length.as[Long]?) { (offset, length) =>
                complete {
                  HdfsFileContent(hdfs.getTextFile(path, offset, length))
                }
              }
            case "download" => complete(???)
          } ~
          parameter('depth.as[Int] ?) { depthOption =>
            complete(readPath(hdfs, path, depthOption.getOrElse(1)))
          }
        } ~
        put {
          operationRoute {
            case "write" =>
              ensureEntity[HdfsFileContent] { content =>
                complete {
                  hdfs.createFile(path, content.content.getBytes, Some(overwrite))
                  StatusCodes.OK
                }
              }

            case "update" =>
              parameter('recursive.as[Boolean]?) { _ =>
                ensureEntity[PartialHdfsFileMeta] { meta =>
                  complete {
                    updateFileMetadata(hdfs, path, meta)
                    StatusCodes.OK
                  }
                }
              }
          }
        } ~
        post {
          operationRoute {
            case "upload" =>
              ensureEntity[StreamEntity] { data =>
                complete {
                  data.items.foreach { is =>
                    hdfs.uploadFile(path, StreamConverters.fromInputStream(() => is), Some(overwrite))
                  }

                  StatusCodes.OK
                }
              }
            case "download" => complete(???)
            case "move" =>
              parameter("to") { to =>
                complete {
                  hdfs.rename(path, normalizePath(decode(to)))
                  StatusCodes.OK
                }
              }
            case "copy" =>
              parameter("to") { to =>
                complete {
                  copy(hdfs, path, normalizePath(decode(to)), overwrite)
                  StatusCodes.OK
                }
              }
            case "mkdir" =>
              complete {
                hdfs.makeDirs(path).toString
              }
          }
        } ~
        delete {
          complete {
            hdfs.delete(path).toString
          }
        }
      }
    }
  }

  private def batchRoute(servicePath: ServicePath, userName: String, srvUserId: Option[Int]): Route = {
    lazy val hdfs = hdfsFactory.byUserId(servicePath, srvUserId, userName)

    post {
      ensureEntity[HdfsBatchRequest] { request =>
        parameter('recursive.as[Boolean] ? true) { recursively =>
          parameter('overwrite.as[Boolean] ? false) { overwrite =>
            def batchOperationRoute(operation: String => Unit): Route = {
              val result = request.files.foldLeft(HdfsBatchResponse(List.empty, List.empty)) { (response, file) =>
                Try { operation(decode(file)) } match {
                  case Success(_) => response.copy(filesSuccess = response.filesSuccess :+ file)
                  case Failure(e) => response.copy(errors = response.errors :+ e.getMessage)
                }
              }
              complete(result)
            }

            operationRoute {
              case "update" =>
                val meta = PartialHdfsFileMeta(request.owner, request.group, request.permissions, request.accessTime, request.modificationTime)
                batchOperationRoute { path: String => updateFileMetadata(hdfs, path, meta) }
              case "copy" =>
                parameter("to") { to =>
                  batchOperationRoute { path: String => copy(hdfs, path, concat(to, extractName(path)), overwrite) }
                }
              case "move" =>
                parameter("to") { to =>
                  batchOperationRoute { path: String => hdfs.rename(path, concat(to, extractName(path)))}
                }

              case "delete" =>
                batchOperationRoute { path: String => hdfs.delete(path, Some(recursively)) }
            }
          }
        }
      }
    }
  }

  private def readPath(hdfs: HdfsService, path: String, depth: Int) = {
    def toWebModel(path: String, maybeStatus: Option[HdfsFileStatus], depth: Int): com.directv.hw.hadoop.model.PathElement = {
      val name = extractName(path)
      val status = maybeStatus getOrElse hdfs.fileStatus(path)
      val (t, children, length) = status.`type` match {
        case HdfsFileTypes.file =>
          (fileType, None, Some(status.length))
        case HdfsFileTypes.directory =>
          val children = if (depth > 0) {
            val statuses = hdfs.listFiles(path)
            Some(statuses map (s => toWebModel(concat(path, s.pathSuffix), Some(s), depth - 1)))
          } else {
            None
          }
          (dirType, children, None)
        case other => throw new DapException(s"Unknown file type: [$other]")
      }

      val perms = toWebPermission(status.permission)
      com.directv.hw.hadoop.model.PathElement(name, path, t, length,
        Some(status.accessTime), Some(status.modificationTime),
        Option(status.owner), Option(status.group), Some(perms),
        children
      )
    }

    toWebModel(path, None, depth)
  }

  private def toWebPermission(permission: String): String = {
    permission match {
      case p if p.isEmpty => "000"
      case p if p.length == 1 => s"00$p"
      case p if p.length == 2 => s"0$p"
      case p if p.length == 3 || (p.length == 4 && p.startsWith("1")) => p
      case p =>
        logger.error(s"Unknown permission value: $p")
        ""
    }
  }

  private def updateFileMetadata(hdfs: HdfsService, path: String, meta: PartialHdfsFileMeta): Unit = {
    if(meta.owner.isDefined || meta.group.isDefined) {
      hdfs.setOwner(path, meta.owner, meta.group)
    }

    if (meta.permissions.isDefined) {
      hdfs.setPermission(path, meta.permissions.map(_.toInt))
    }

    if(meta.accessTime.isDefined || meta.modificationTime.isDefined) {
      hdfs.setFileTimes(path, meta.accessTime, meta.modificationTime)
    }
  }

  private def copy(hdfs: HdfsService, path: String, to: String, overwrite: Boolean): Unit = {
    val status = hdfs.fileStatus(path)
    status.`type` match {
      case HdfsFileTypes.file =>
        val content = hdfs.downloadFile(path)
        hdfs.uploadFile(to, content)
      case HdfsFileTypes.directory =>
        hdfs.makeDirs(to)
        hdfs.listFiles(path).foreach { s =>
          copy(hdfs, concat(path, s.pathSuffix), concat(to, s.pathSuffix), overwrite)
        }
    }
  }

  private def operationRoute(operations: PartialFunction[String, Route]) = {
    parameter("operation") {
      case op if operations.isDefinedAt(op) => operations(op)
      case other => complete(throw new ServerError(s"Unsupported operation: [$other]"))
    }
  }
}