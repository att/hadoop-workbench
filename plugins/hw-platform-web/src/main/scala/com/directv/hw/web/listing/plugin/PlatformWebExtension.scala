package com.directv.hw.web.listing.plugin

import com.directv.hw.common.io.DapIoUtils
import com.directv.hw.common.web.WebCommon
import com.directv.hw.core.auth.SecurityFeatures.clusterSettingsRead
import com.directv.hw.core.auth.{SecurityFeatures, UserSecurityContext}
import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.core.exception.{InconsistancyException, ServerError}
import com.directv.hw.core.plugin.web.WebExtension
import com.directv.hw.core.service.HadoopServiceTypes
import com.directv.hw.core.validation.ValidationUtils
import com.directv.hw.hadoop.flume.service.FlumeLocalRepo
import com.directv.hw.hadoop.oozie.service.OozieDeploymentService
import com.directv.hw.hadoop.platform.model._
import com.directv.hw.hadoop.platform.service.PlatformManager
import com.directv.hw.hadoop.platform.status.PlatformStatusService
import com.directv.hw.hadoop.platform.{PlatformMetadataService, PlatformTypes}
import com.directv.hw.web.listing.model._
import com.directv.hw.web.listing.scaldi.PlatformModule
import com.typesafe.scalalogging.LazyLogging
import ro.fortsoft.pf4j.{Extension, Plugin, PluginDescriptor, PluginWrapper}
import scaldi.{Injectable, Injector}
import spray.http.StatusCodes
import spray.routing.Route

import scala.collection.immutable.HashMap
import scala.concurrent.ExecutionContext
import scala.language.postfixOps

class PlatformWebPlugin(pluginWrapper: PluginWrapper) extends Plugin(pluginWrapper)

@Extension
class PlatformWebExtension(injector: Injector) extends WebExtension with WebCommon
  with KeyRoute with SrvUsersRoute with PlatformAccessRoute with ClustersRoute with PlatformWebConverter
  with PlatformJsonFormats with Injectable with LazyLogging {

  private[plugin] lazy val context: Injector = new PlatformModule()(injector)
  private implicit val pluginInjector: Injector = context

  private val metadataService = inject[PlatformMetadataService]
  private val platformService = inject[PlatformManager]
  private val dispatcherFactory = inject[DispatcherFactory]
  private val platformStatusService = inject[PlatformStatusService]
  private val pluginInfo = inject[PluginDescriptor]
  private val ooziePlatformRepo = inject[OozieDeploymentService]
  private val flumeLocalRepo = inject[FlumeLocalRepo]

  private implicit val dispatcher: ExecutionContext = dispatcherFactory.dispatcher

  override def route: UserSecurityContext => Route = { userContext: UserSecurityContext => {
    pathPrefix(pluginInfo.getPluginId) {
      pathPrefix("api") {
        pathPrefix("v1.0") {
          pathPrefix("platforms") {
            platformRoute(userContext)
          } ~
          pathPrefix("serviceTypes") {
            get {
              complete(ServiceTypeList(platformService.getServiceTypes))
            }
          } ~
          pathPrefix("allClusters") {
            parameters('includeOffline.as[Boolean]? false, 'cacheOnly.as[Boolean]? false) { (includeOffline, cacheOnly) =>
              get {
                complete {
                  allClusters(includeOffline, cacheOnly)
                }
              }
            }
          } ~
          pathPrefix("flatModules") {
            get {
              complete(FullModuleList(getDeployedComponents))
            }
          }
        }
      }
    }}
  }

  private def platformRoute(userContext: UserSecurityContext) = {
    pathEndOrSingleSlash {
      get {
        parameter('view?) { view =>
          authorize(view.contains("full") && userContext.isAllowed(clusterSettingsRead) || !view.contains("full")) {
            complete {
              view match {
                case Some("full") => FullPlatformList(platformService.getFullPlatforms)
                case Some("short") | None => PlatformList(platformService.getBriefPlatforms)
                case Some(other) => throw new ServerError(s"Unknown view: [$other]")
              }
            }
          }
        }
      } ~
      post {
        authorize(userContext.isAllowed(SecurityFeatures.clusterSettingsWrite)) {
          ensureEntity[Platform] { requestPlatform =>
            complete {
              validatePlatform(requestPlatform)
              val platform = if(requestPlatform.id.isDefined) requestPlatform.copy(id = None) else requestPlatform
              val platformId = platformService.addPlatform(platform)
              CreatedPlatformResponse(platformId)
            }
          }
        }
      }
    } ~
    pathPrefix("types") {
      get {
        platformTypeRoute
      }
    } ~
    pathPrefix(IntNumber) { platformId =>
      pathEndOrSingleSlash {
        get {
          complete(platformService.getBriefPlatform(platformId))
        } ~
        put {
          authorize(userContext.isAllowed(SecurityFeatures.clusterSettingsWrite)) {
            jsonEntity[Platform] { platform =>
              validatePlatform(platform)
              complete {
                platformService.updatePlatform(platform.copy(id = Some(platformId)))
                StatusCodes.OK
              }
            }
          }
        } ~
        delete {
          authorize(userContext.isAllowed(SecurityFeatures.clusterSettingsWrite)) {
            complete {
              platformService.deletePlatform(platformId)
              StatusCodes.OK
            }
          }
        }
      } ~
      pathPrefix("keys") {
        keyRoute(userContext, Some(platformId))
      } ~
      pathPrefix("users") {
        usersRoute(userContext, Some(platformId))
      } ~
      path("status") {
        complete {
          platformStatusService.getStatus(platformId).map { _.map(convertToMessage(_, platformId)) }
        }
      } ~
      path("metadata") {
        //noinspection ScalaDeprecation
        complete(metadataService.platformMeta(platformId))
      } ~
      pathPrefix("access") {
        platformAccessRoute(userContext, platformId)
      } ~
      pathPrefix("clusters") {
        clustersRoute(userContext, platformId)
      }
    }
  }

  private val platformTypeRoute = {
    get {
      pathEndOrSingleSlash {
        completeJsonResponse(DapIoUtils.loadResourceAsString(getClass, "metadata/platformTypes.json"))
      } ~
      pathPrefix(Segment) { `type` =>
        pathPrefix("metadata") {
          completeJsonResponse(metadataService.platformMeta(`type`))
        }
      }

    }
  }

  private def getDeployedComponents: List[FullModuleInfo] = {

    val platforms = platformService.getBriefPlatforms.foldLeft(HashMap.empty[Int, PlatformInfo]) { (map, platform) =>
      map + (platform.id -> platform)
    }

    def platform(id: Int) = platforms.getOrElse(id, throw InconsistancyException("platfors not found in db"))

    val oozieComponents = ooziePlatformRepo.getDeployments.map { comp =>

      FullWorkflowInfo (
        comp.path,
        comp.name,
        comp.renderedName,
        comp.version,
        platform(comp.platformId),
        ClusterInfo(comp.clusterId, comp.clusterId)
      )
    }

    val flumeComponents = flumeLocalRepo.getAllComponents.map { comp =>
      FullAgentInfo (
        comp.componentId,
        comp.name,
        comp.activeAgents,
        isBase = false,
        platform(comp.platformId),
        ClusterInfo(comp.clusterId, comp.clusterId),
        ServiceInfo(comp.serviceId, comp.serviceId, HadoopServiceTypes.flume)
      )
    }

    oozieComponents ++ flumeComponents

  }

  private def allClusters(includeOffline: Boolean, cacheOnly: Boolean): FlatClusterList = {

      val platforms = platformService.getBriefPlatforms.map { platform =>
        val clusterList = try {
          resolveClusters(platform.id, includeOffline, None, cacheOnly)
        } catch {
          case e: Exception => throw new ServerError(s"Problem with platform [${platform.title}]: ${e.getMessage}")
        }

        PlatformWithClusters(platform, clusterList.clusters, clusterList.isOnline)
      }

      FlatClusterList(platforms)

  }
  
  import ValidationUtils._

  private def validatePlatform(platform: Platform): Unit = {
    ensureNonEmpty(platform.`type`, "type")
    ensureNonEmpty(platform.version, "version")
    validateApi(platform.api)
    ensureNonEmpty(platform.api.protocol, "protocol")
  }

  private def validateApi(api: Api): Unit = {
    ensureNonEmpty(api.host, "host")
    ensureValidPort(api.port, "port")
  }
}