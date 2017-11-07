package com.directv.hw.web.tenant.plugin

import java.io.{ByteArrayInputStream, ByteArrayOutputStream, InputStream}
import com.directv.hw.common.io.PackUtils
import com.directv.hw.common.web.{StreamEntity, WebCommon}
import com.directv.hw.core.auth.UserSecurityContext
import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.core.exception.ServerError
import com.directv.hw.core.plugin.web.WebExtension
import com.directv.hw.hadoop.deployment.DeploymentService
import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.model.{ClusterPath, MetaFile, ModuleFile, ModuleFileCommon}
import com.directv.hw.hadoop.template.model.{Template, TemplatesImportResult, Tenant}
import com.directv.hw.hadoop.template.service.TenantService
import com.directv.hw.web.tenant.model._
import com.directv.hw.web.tenant.scaldi.TenantModule
import com.typesafe.scalalogging.LazyLogging
import ro.fortsoft.pf4j.{Extension, Plugin, PluginDescriptor, PluginWrapper}
import scaldi.{Injectable, Injector}
import spray.http.StatusCodes
import spray.routing.Route
import scala.concurrent.ExecutionContext
import scala.language.postfixOps

class TenantWebPlugin(pluginWrapper: PluginWrapper) extends Plugin(pluginWrapper)

@Extension
class TenantWebExtension(implicit injector: Injector) extends WebExtension with WebCommon with TenantJsonFormats with Injectable with LazyLogging {

  implicit lazy val context: TenantModule = new TenantModule()(injector)
  implicit lazy val dispatcher: ExecutionContext = inject[DispatcherFactory].dispatcher

  private val tenantService = inject[TenantService]
  private val pluginInfo = inject[PluginDescriptor]
  private val deploymentService = inject[DeploymentService]

  override def route: UserSecurityContext => Route = { implicit userContext: UserSecurityContext =>
    pathPrefix(pluginInfo.getPluginId) {
      pathPrefix("api") {
        pathPrefix("v1.0") {
          pathPrefix("components") {
            post {
              parameter('operation) {
                case "s3import" =>
                  jsonEntity[S3ImportRequest] { req =>
                    complete(importFromS3(req)(userContext.user))
                  }
                case _ => badRouteError
              }
            } ~
            put {
              parameter('operation) {
                case "s3export" =>
                  jsonEntity[S3ExportRequest] { req =>
                    complete(tenantService.exportToS3(req.componentId).map(_ => StatusCodes.OK))
                  }

                case _ => badRouteError
              }

            }
          } ~
          pathPrefix("tenants") {
            tenantsRoute(userContext.user)
          } ~
          pathPrefix("templates") {
            get {
              complete(Templates(tenantService.getAllTemplates))
            } ~
            post {
              uploadRoute(None, userContext.user)
            }
          } ~
          pathPrefix("flatTemplates") {
            get {
              complete(FlatTemplates(flatTemplates()))
            }
          }
        } ~
        badRouteError
      }
    }
  }

  private def tenantsRoute(user: String) = {
    pathPrefix(IntNumber) { tenantId =>
      pathPrefix("templates") {
        pathPrefix(IntNumber) { templateId =>
          delete {
            complete {
              tenantService.deleteTemplate(templateId, user)
              StatusCodes.OK
            }
          }
        } ~
        get {
          complete(Templates(tenantService.getTemplates(tenantId)))
        } ~
        post {
          uploadRoute(Some(tenantId), user)
        }
      } ~
      (post | get) {
        parameter("action") {
          case "download" =>
            val (fileName, content) = packTenant(tenantId)
            ???
          case other =>
            throw new ServerError(s"Unknown action: [$other]")
        }
      } ~
      get {
        complete(tenantService.getTenant(tenantId))
      } ~
      delete {
        parameter('force.as[Boolean]?) { force =>
          complete {
            tenantService.deleteTenant(tenantId, force getOrElse false, user)
            StatusCodes.OK
          }
        }
      }
    } ~
    get {
      complete(Tenants(tenantService.getTenants))
    } ~
    post {
      ensureEntity[Tenant] { tenant =>
        complete(CreatedTenant(tenantService.createTenant(tenant, user)))
      }
    } ~
    put {
      ensureEntity[Tenant] { tenant =>
        complete {
          tenantService.updateTenant(tenant, user)
          StatusCodes.OK
        }
      }
    }
  }

  private def importFromS3(request: S3ImportRequest)(user: String)  = {
    val components = tenantService.importFromS3(request.s3bucket, request.s3key, user = user)
    components.foreach { component =>
      val clusterPath = new ClusterPath(request.platformId, request.clusterId)
      deploymentService.deploy(component.info.id, clusterPath, request.env, user)
    }

    TemplatesImportResult(components)
  }

  private def uploadRoute(tenantId: Option[Int], user: String) = {
    parameter('overwrite.as[Boolean] ? false) { overwrite =>
      ensureEntity[StreamEntity] { req =>
        complete {
          val components = req.items.map { (is: InputStream) =>
            tenantService.importArchivedBundle(tenantId, is, overwrite, user)
          }.reduce { (a, b) => a ::: b }

          TemplatesImportResult(components)
        }
      }
    }
  }

  private def flatTemplates() = {
    val tenantsById = tenantService.getTenants map (tenant => tenant.id.get -> tenant) toMap
    val allTemplates: List[Template] = tenantService.getAllTemplates
    allTemplates map { template =>
      FlatTemplate(template, tenantsById(template.info.tenantId))
    }
  }

  private def packTenant(tenantId: Int) = {
    def makeFileName(name: String, version: String) = s"$name-$version".replaceAll("[^a-zA-Z0-9_\\-., ]", "")

    val baos = new ByteArrayOutputStream()

    val tenant = tenantService.getTenant(tenantId)

    val fileServices = tenantService.getTemplates(tenantId) map { template =>
      val templateService = tenantService.getTenantRepo(template.info.`type`)
      val dirName = makeFileName(template.info.name, template.info.version)
      dirName -> templateService.getFileService(template.info.id)
    } toMap

    val templateFiles = fileServices flatMap { case (dir, fileService) =>
      fileService.listFiles(ComponentFS.root, ComponentFS.includeDirectories, ComponentFS.unlimited) map { file =>
        file.copy(path = s"$dir/${file.path}")
      }
    } toList
    val descriptorFile = ModuleFile(MetaFile.bundleDescPath, ModuleFileCommon.file, -1)

    def read: String => InputStream = { packPath =>
      val parts = packPath.split("/", 2)
      val dir = parts(0)
      val path = parts(1)
      dir match {
        case MetaFile.metaDir =>
          // TODO (vkolischuk) create bundle descriptor properly
          val description = s"""{"description": "${tenant.name} v ${tenant.version}" }"""
          new ByteArrayInputStream(description.getBytes)
        case d: String =>
          fileServices(d).readFile(path)
      }
    }

    PackUtils.packTarBz2(baos, templateFiles :+ descriptorFile, read)

    (makeFileName(tenant.name, tenant.version) + ".tar.bz2") -> baos.toByteArray
  }
}
