package com.directv.hw.web.listing.plugin

import akka.actor.ActorRef
import com.directv.hw.common.web.WebCommon
import com.directv.hw.core.auth.SecurityFeatures.clusterSettingsRead
import com.directv.hw.core.auth.SecurityFeatures.clusterSettingsWrite
import com.directv.hw.core.auth.UserSecurityContext
import com.directv.hw.core.exception.{DapException, ServerError}
import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.access._
import com.directv.hw.hadoop.config.ClusterServiceResolver
import com.directv.hw.hadoop.flume.cache.{FlumeUpdateActor, FlumeUpdateActorHolder}
import com.directv.hw.hadoop.hdfs.exception.{HdfsAccessException, HdfsPermissionException}
import com.directv.hw.hadoop.hdfs.model.HdfsFileTypes
import com.directv.hw.hadoop.http.client.{ConnectionException, RequestException}
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.hadoop.oozie.model.OozieIndexation
import com.directv.hw.hadoop.platform.PlatformMetadataService
import com.directv.hw.hadoop.platform.model.{ClusterInfo, ServiceInfo}
import com.directv.hw.hadoop.platform.service.PlatformManager
import com.directv.hw.web.listing.model._
import spray.routing.Route
import akka.pattern.ask
import akka.util.Timeout
import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.hadoop.di.DiReferences
import com.directv.hw.hadoop.hdfs.HdfsServiceFactory
import scaldi.{Injectable, Injector}
import spray.http.StatusCodes

import scala.concurrent.duration._
import scala.concurrent.{ExecutionContext, Future}
import scala.language.postfixOps
import scala.util.Try

trait ClustersRoute extends Injectable {
  self: WebCommon with PlatformWebConverter with PlatformJsonFormats with KeyRoute with SrvUsersRoute =>

  private[plugin] val context: Injector
  private implicit val injector: Injector = context

  private val accessManager = inject[AccessManagerService]
  private val metadataService = inject[PlatformMetadataService]
  private val clusterServiceResolver = inject[ClusterServiceResolver]
  private val platformService = inject[PlatformManager]
  private val asyncHdfsFactory = inject[HdfsServiceFactory]
  private val oozieIndexer = inject[ActorRef](DiReferences.oozieIndexer)
  private val flumeUpdateActor = inject[FlumeUpdateActorHolder].actor
  private val appConf = inject[AppConf]
  private val dispatcherFactory = inject[DispatcherFactory]

  private implicit val dispatcher: ExecutionContext = dispatcherFactory.auxiliaryDispatcher
  private implicit val askTimeout: Timeout = Timeout(appConf.incomingHttpRqTimeoutMs millis)

  private[plugin] def clustersRoute(userContext: UserSecurityContext, platformId: Int): Route = {
    pathEndOrSingleSlash {
      get {
        parameters('includeOffline.as[Boolean]? false, 'view?) { (includeOffline, view) =>
          authorize(view.contains("admin") && userContext.isAllowed(clusterSettingsRead) || !view.contains("admin")) {
            complete(resolveClusters(platformId, includeOffline, view, cacheOnly = false))
          }
        }
      }
    } ~
    path("metadata") {
      completeJsonResponse(metadataService.clusterMeta(platformId))
    } ~
    pathPrefix(Segment) { clusterId =>
      lazy val clusterPath = new ClusterPath(platformId, clusterId)
      pathEndOrSingleSlash {
        authorize(userContext.isAllowed(clusterSettingsWrite)) {
          put {
            ensureEntity[FullClusterInfo] { info =>
              complete {
                saveClusterSettings(clusterPath, info)
                StatusCodes.OK
              }
            }
          }
        }
      } ~
      pathPrefix("keys") {
        keyRoute(userContext, Some(platformId), Some(clusterId))
      } ~
      pathPrefix("users") {
        usersRoute(userContext, Some(platformId), Some(clusterId))
      } ~
      path("properties") {
        authorize(userContext.isAllowed(clusterSettingsRead)) {
          get {
            complete {
              CustomProperties (
                accessManager.findCustomClusterProperties(clusterPath)
              )
            }
          }
        }
      } ~
      path("configs") {
        authorize(userContext.isAllowed(clusterSettingsWrite)) {
          put {
            complete {
              clusterServiceResolver.pullAndResolve(clusterPath)
              StatusCodes.OK
            }
          }
        }
      } ~
      path("environments") {
        get {
          complete(ClusterEnvironments(accessManager.findClusterEnvironments(clusterPath)))
        }
      } ~
      path("services") {
        get {
          parameter("serviceType") { serviceType: String => // all services of the specified type in the cluster
            complete(ServiceList(findServices(platformId, clusterId, serviceType)))
          }
        }
      } ~
      pathPrefix("hdfs") {
        hdfsRoute(clusterPath, userContext)
      }
    }
  }

  private def runIndexHdfs(clusterPath: ClusterPath, path: String, user: String): Unit = {
    val hdfs = asyncHdfsFactory.byTeam(clusterPath, appConf.defaultTeam)

    try {
      val status = hdfs.fileStatus(path)
      if(status.`type` != HdfsFileTypes.directory) {
        throw new ServerError(s"Not a valid directory: $path")
      }

      hdfs.listFiles(path)
    } catch {
      case e: HdfsPermissionException => throw RequestException(s"Permission denied for path $path", e)
      case e: HdfsAccessException => throw new DapException(s"Cannot access path $path", e)
    }

    oozieIndexer ! OozieIndexation.StartIndexation(clusterPath, path, user)

    // TODO: move this to separate route
    flumeUpdateActor ! FlumeUpdateActor.UpdateCluster(clusterPath)
  }

  private def stopIndexHdfs(clusterPath: ClusterPath): Unit = {
    oozieIndexer ! OozieIndexation.StopIndexation(clusterPath)
  }

  private def getIndexHdfs(clusterPath: ClusterPath): Future[IndexationStatus] = {
    (oozieIndexer ? OozieIndexation.GetStatus(clusterPath)).mapTo[OozieIndexation.Status].map {
      status => IndexationStatus(status.value)
    }
  }

  private def hdfsRoute(clusterPath: ClusterPath, userContext: UserSecurityContext) = {
    pathPrefix("index") {
      authorize(userContext.isAllowed(clusterSettingsWrite)) {
        path(Rest) { path =>
          post {
            complete {
              runIndexHdfs(clusterPath, s"/$path", userContext.user)
              StatusCodes.OK
            }
          }
        } ~
        post {
          complete {
            runIndexHdfs(clusterPath, "/", userContext.user)
            StatusCodes.OK
          }
        } ~
        delete {
          complete {
            stopIndexHdfs(clusterPath)
            StatusCodes.OK
          }
        } ~
        get {
          complete(getIndexHdfs(clusterPath))
        }
      }
    }
  }

  private def findServices(platformId: Int, clusterId: String, serviceType: String): List[ServiceInfo] = {
    platformService.getServices(new ClusterPath(platformId, clusterId)).filter(_.`type` == serviceType)
  }

  private def saveClusterSettings(clusterPath: ClusterPath, cluster: FullClusterInfo): Unit = {
    accessManager.saveClusterSettings (
      clusterPath,
      ClusterSettings(cluster.info.kerberized.getOrElse(false), cluster.info.realm)
    )
    accessManager.save(clusterPath, cluster.customData)
    cluster.hdfsAccess.foreach(accessManager.save(clusterPath, _))
    cluster.oozieAccess.foreach(accessManager.saveOozieAccess(clusterPath, _))
  }

  private[plugin] def resolveClusters(platformId: Int, includeOffline: Boolean, view: Option[String], cacheOnly: Boolean): ClusterList = {
    val dbClusters = platformService.findDbClusters(platformId) map (c => c.id -> c) toMap

    def platformCall[T](call: => T): Option[T] = {
      if (cacheOnly) {
        None
      } else {
        Some(call)
      }
    }

    def toFullClusterInfo(cluster: ClusterInfo): FullClusterInfo = {
      val clusterPath = new ClusterPath(platformId, cluster.id)
      view match {
        case Some("admin") =>
          val clusterSettings = accessManager.getClusterSettings(clusterPath)

          FullClusterInfo (
            ClusterInfo (
              cluster.id,
              cluster.title,
              kerberized = clusterSettings.map(_.kerberized),
              realm = clusterSettings.flatMap(_.realm)
            ),
            accessManager.findHdfsAccess(clusterPath),
            accessManager.findOozieAccess(clusterPath),
            accessManager.findCustomClusterProperties(clusterPath),
            platformService.getLastConfigUpdate(clusterPath)
          )

        case None =>
          FullClusterInfo (
            ClusterInfo (
              cluster.id,
              cluster.title
            )
          )

        case Some(other) =>
          throw new ServerError(s"Unknown view: $other")
      }
    }

    def getDbClusters = {
      ClusterList(dbClusters.values map toFullClusterInfo toList, isOnline = false)
    }

    platformCall {
      Try {
        val clusters = platformService.getClusters(platformId)
        ClusterList(clusters map toFullClusterInfo, isOnline = true)
      } recover {
        case _: ConnectionException if includeOffline =>
          getDbClusters
      } get
    } getOrElse getDbClusters
  }
}
