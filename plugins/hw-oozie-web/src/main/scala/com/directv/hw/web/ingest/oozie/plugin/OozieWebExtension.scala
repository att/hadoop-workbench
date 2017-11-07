package com.directv.hw.web.ingest.oozie.plugin

import akka.util.Timeout
import com.directv.hw.common.web.{FilesRoute, WebCommon}
import com.directv.hw.core.auth.UserSecurityContext
import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.core.plugin.web.WebExtension
import com.directv.hw.core.service.{AppConf, HadoopServiceRegistry, HadoopServiceTypes}
import com.directv.hw.hadoop.oozie.service._
import com.directv.hw.hadoop.model._
import com.directv.hw.hadoop.oozie.model.{CreateWorkflowTemplateRequest, DeploymentResult}
import com.directv.hw.hadoop.template.model.UpdateTemplateInfo
import com.directv.hw.web.ingest.oozie.model._
import com.directv.hw.web.ingest.oozie.scaldi.OozieModule
import com.typesafe.scalalogging.LazyLogging
import ro.fortsoft.pf4j.{Extension, Plugin, PluginDescriptor, PluginWrapper}
import scaldi.{Injectable, Injector}
import spray.http.StatusCodes
import spray.routing.Route

import scala.concurrent.ExecutionContext
import scala.concurrent.duration._
import scala.language.postfixOps

class OozieWebPlugin(pluginWrapper: PluginWrapper) extends Plugin(pluginWrapper)

@Extension
class OozieWebExtension(implicit injector: Injector) extends WebExtension with Injectable with WebCommon
  with MetaDataRoute with FilesRoute with OozieJsonFormats with WorkflowRoute with JobsRoute with LazyLogging {

  override protected implicit lazy val diContext: OozieModule = new OozieModule()(injector)
  override protected implicit lazy val executionContext: ExecutionContext = inject[DispatcherFactory].auxiliaryDispatcher

  override protected lazy val metaDataService: OozieMetaDataService = inject[OozieMetaDataService]
  override protected lazy val oozieService: OozieService = inject[OozieService]
  override protected lazy val oozieRuntimeService: OozieRuntimeService = inject[OozieRuntimeService]
  override protected lazy val logService: OozieLogService = inject[OozieLogService]
  override protected lazy val webConverter: WorkflowWebConverter = inject[WorkflowWebConverter]
  override protected lazy val deploymentContentServiceFactory: OozieDeploymentContentServiceFactory =
    inject[OozieDeploymentContentServiceFactory]

  private val componentContentServiceFactory = inject[OozieComponentContentServiceFactory]
  private val pluginInfo = inject[PluginDescriptor]
  private val registry = inject[HadoopServiceRegistry]
  private val supportedVersions = oozieService.getSupportedWorkflowVersions
  registry.registerType(HadoopServiceTypes.oozie, Some(supportedVersions))

  private val webTimeoutMillis = inject[AppConf].incomingHttpRqTimeoutMs.toLong

  implicit private val asyncTimeout: Timeout = Timeout((webTimeoutMillis + 500) millis)

  override def route: UserSecurityContext => Route = { userContext: UserSecurityContext =>
    pathPrefix(pluginInfo.getPluginId) {
      pathPrefix("api") {
        pathPrefix("v1.0") {
          path("supportedVersions") {
            complete(VersionList(supportedVersions))
          } ~
          pathPrefix("metadata") {
            metadataRoute
          } ~
          pathPrefix("platforms" / IntNumber) { platformId =>
            platformRoute(platformId)(userContext)
          } ~
          pathPrefix("templates") {
            templatesRoute(userContext)
          } ~
          path("deploy") {
            post {
              entity(as[DeployByPathRequest]) { request =>
                complete(deploy(request, userContext.user))
              } ~
              entity(as[DeployByEnvRequest]) { request =>
                complete(deploy(request, userContext.user))
              }
            }
          }
        }
      }
    }
  }

  private def platformRoute(platformId: Int)(userContext: UserSecurityContext): Route = {
    pathPrefix("clusters" / Segment) { clusterId =>
      val clusterPath = new ClusterPath(platformId, clusterId)
      pathPrefix("jobs") {
        jobRoute(platformId, clusterId)(userContext.user)
      } ~
      pathPrefix("services" / Segment) { _ =>
        pathPrefix("workflows") {
          workflowsRoute(clusterPath, userContext)
        }
      } ~
      pathPrefix("workflows") {
        workflowsRoute(clusterPath, userContext)
      }
    }
  }

  private def templatesRoute(userContext: UserSecurityContext): Route = {
    pathPrefix("mustache") {
      get {
        complete(MustacheProperties(oozieService.mustacheProperties))
      }
    } ~
    pathPrefix("workflows") {
      pathPrefix(IntNumber) { templateId =>
        lazy val contentService = componentContentServiceFactory.getService(templateId, userContext.user)
        simpleFilesRoute(userContext, contentService) ~
        get {
          complete(oozieService.getComponent(templateId))
        } ~
        put {
          ensureEntity[UpdateWorkflowTemplateRequest] { request =>
            val info = UpdateTemplateInfo(request.name, request.version, request.description, request.team)
            complete {
              oozieService.updateComponentInfo(templateId, info, userContext.user)
              StatusCodes.OK
            }
          }
        }
      } ~
      parameter("version") { version =>
        get {
          complete(WorkflowTemplates(oozieService.findComponents(version)))
        }
      } ~
      post {
        ensureEntity[CreateWorkflowTemplateRequest] { request =>
          complete(CreatedWorkflowTemplate(oozieService.createComponent(request, userContext.user).info.id))
        }
      }
    }
  }

  private def deploy(request: DeployByPathRequest, userName: String): DeploymentResult = {
    val hdfsPath = new HdfsPath(request.platformId, request.clusterId, request.path)
    oozieService.deployByPath(request.templateId, hdfsPath, userName)
  }

  private def deploy(request: DeployByEnvRequest, userName: String): DeploymentResult = {
    val clusterPath = new ClusterPath(request.platformId, request.clusterId)
    oozieService.deployByEnv(request.templateId, clusterPath, request.env, userName)
  }
}


