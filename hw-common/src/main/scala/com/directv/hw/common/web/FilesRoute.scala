package com.directv.hw.common.web

import java.io.ByteArrayOutputStream
import com.directv.hw.common.io.PackUtils
import com.directv.hw.core.auth.UserSecurityContext
import com.directv.hw.core.exception.ServerError
import com.directv.hw.core.service.Overwrite
import com.directv.hw.hadoop.files.{ComponentFS, ContentService}
import com.directv.hw.hadoop.model.PathCommon._
import com.directv.hw.hadoop.model._
import com.typesafe.scalalogging.LazyLogging
import spray.http.StatusCodes
import spray.routing._
import scala.language.postfixOps

trait FilesRoute extends LazyLogging with FilesRouteFormats {

  self: WebCommon with CommonJsonFormats =>

  def simpleFilesRoute(userContext: UserSecurityContext,
                       contentService: => ContentService,
                       readAllowed: => Boolean = true,
                       writeAllowed: => Boolean = true): Route = {

    parameter("operation"?) {
      case Some("list") =>
        authorize(readAllowed) {
          get {
            completeWithDebugAudit(userContext.user, "LIST_FILES")(ModuleFiles(contentService.listFiles()))
          }
        }
      case Some("listFiles") =>
        authorize(readAllowed) {
          parameter("path") { paramPath =>
            get {
              completeWithDebugAudit(userContext.user, "FILE_STATUS")(readPath(contentService, toFilePath(paramPath)))
            }
          }
        }
      case Some("download") =>
        authorize(readAllowed) {
          (post | get) {
            completeWithDebugAudit(userContext.user, "DOWNLOAD_FILES")(???)
          }
        }
      case Some("copy") =>
        post {
          authorize(readAllowed) {
            entity(as[CopyFilesToPlatform]) { rq =>
              completeWithAudit(userContext.user, "COPY_FILES_TO_DEPLOYMENT", s"deploymentPath=${rq.platformId}/${rq.clusterId}/${rq.moduleId}") {
                val modulePath = new ModulePath(rq.platformId, rq.clusterId, rq.serviceId, rq.moduleId)
                contentService.copyTo(modulePath, rq.files)
                StatusCodes.OK
              }
            }
          } ~
          authorize(writeAllowed) {
            ensureEntity[CopyFilesToTenant] { rq =>
              completeWithAudit(userContext.user, "COPY_FILES_TO_COMPONENT", s"componentId=${rq.templateId}") {
                contentService.copyTo(rq.templateId, rq.files)
                StatusCodes.OK
              }
            }
          }
        }
      case other => reject
    } ~
    filesRoute(userContext, contentService, readAllowed, writeAllowed)
  }

  private def filesRoute(userContext: UserSecurityContext,
                         fileService: => ContentService,
                         readAllowed: => Boolean,
                         writeAllowed: => Boolean): Route = {

    def getFile(file: String) = {
      fileService.listFiles(file, ComponentFS.includeDirectories, ComponentFS.fileOnly).head
    }

    parameters('file, 'format?, 'overwrite.as[Boolean] ? true) { (paramFile, format, paramOverwrite) =>
      val file = toFilePath(paramFile)
      val overwrite = if (paramOverwrite) {
        Overwrite.OVERWRITE
      } else {
        Overwrite.FAIL_ON_EXISTING
      }

      get {
        parameter("operation"?) {
          case Some("download") =>
            authorize(readAllowed) {
              completeWithDebugAudit(userContext.user, "DOWNLOAD_FILE", s"file=$file, format=$format")(???)
            }
          case None =>
            authorize(readAllowed) {
              completeWithDebugAudit(userContext.user, "READ_FILE", s"file=$file, format=$format") {
                val start = System.currentTimeMillis
                val service = fileService
                logger.trace(s"content service construction: ${System.currentTimeMillis - start} ms")
                service.getFileContent(file, format)
              }
            }
          case other => reject
        }
      } ~
      put {
        authorize(writeAllowed) {
          jsonEntity[FileContent] { content =>
            completeWithAudit(userContext.user, "WRITE_FILE", s"file=$file") {
              fileService.saveFileContent(file, content, overwrite)
              StatusCodes.OK
            }
          }
        }
      } ~
      post {
        authorize(writeAllowed) {
          parameter("to") { to =>
            completeWithAudit(userContext.user, "MOVE_FILE", s"file=$file, to=$to") {
              fileService.move(file, to, overwrite)
              getFile(to)
            }
          } ~
          parameter("operation") {
            case "convert" =>
              ensureEntity[FileContent] { content =>
                complete {
                  content match {
                    case FileContent(_, Some(parsed: ParsedContent)) =>
                      FileContent(text = Some(fileService.convert(file, parsed)))
                    case FileContent(Some(text: String), _) if format.nonEmpty =>
                      FileContent(content = Some(fileService.convert(file, text, format.get)))
                    case _ =>
                      throw new ServerError(s"Illegal convert request")
                  }
                }
              }
            case other => reject
          } ~
          (if (file.endsWith(ModuleFileCommon.separator)) {
            completeWithAudit(userContext.user, "CREATE_DIR", s"dir=$file") {
              fileService.createDir(file)
              getFile(file)
            }
          } else {
            ensureEntity[StreamEntity] { data =>
              completeWithAudit(userContext.user, "WRITE_BINARY_FILE", s"file=$file") {
                fileService.saveBinaryFile(file, data.items.head, overwrite)
                getFile(file)
              }
            }
          })
        }
      } ~
      delete {
        authorize(writeAllowed) {
          completeWithAudit(userContext.user, "DELETE_FILE", s"file=$file") {
            fileService.delete(file)
            StatusCodes.OK
          }
        }
      }
    }
  }

  private def export(fileService: ContentService): Array[Byte] = {
    val baos = new ByteArrayOutputStream()
    PackUtils.packTarBz2(baos, fileService.listFiles(), (file: String) => fileService.getBinaryFile(file))
    baos.toByteArray
  }

  private def toFilePath(path: String) = {
    decode(path)
  }

  private def readPath(fileService: ContentService, path: String) = {
    val files = fileService.listFiles(from = path, depth = ComponentFS.withChildren)
    val (maybeFile, children) = files partition (_.path == path)
    val childElements = children map { toWebFile(_, None) }
    maybeFile.headOption match {
      case Some(file) => toWebFile(file, Some(childElements))
      case None => com.directv.hw.hadoop.model.PathElement(name = "", path = path, `type` = PathCommon.dirType, children = Some(childElements))
    }
  }

  private def toWebFile(file: ModuleFile, children: Option[List[PathElement]]) = {
    com.directv.hw.hadoop.model.PathElement (
      name = extractName(file.path),
      path = toWebPath(file.path),
      `type` = resolveType(file.`type`),
      size = resolveSize(file),
      modificationTime = file.modificationTime,
      children = children
    )
  }

  private def toWebPath(path: String) = {
    if (path startsWith PathCommon.separator) {
      path
    } else {
      separator + path
    }
  }

  private def resolveType(`type`: String) = {
    `type` match {
      case ModuleFileCommon.file => PathCommon.fileType
      case ModuleFileCommon.dir => PathCommon.dirType
    }
  }

  private def resolveSize(file: ModuleFile) = {
    file.`type` match {
      case ModuleFileCommon.file if file.size >= 0 => Some(file.size)
      case ModuleFileCommon.dir => None
    }
  }
}
