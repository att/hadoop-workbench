package com.directv.hw.hadoop.flume.cache

import java.time.Instant

import akka.actor.{Actor, ActorRef}
import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.core.service.HadoopServiceTypes
import com.directv.hw.hadoop.flume.cache.FlumeUpdateActor._
import com.directv.hw.hadoop.flume.routing.FlumeServiceRouter
import com.directv.hw.hadoop.flume.service.FlumeLocalRepo
import com.directv.hw.hadoop.model.{ClusterPath, ModulePath, RelativeServicePath}
import com.directv.hw.hadoop.platform.model.ServiceInfo
import com.directv.hw.hadoop.platform.service.PlatformManager
import com.directv.hw.persistence.dao.{ClusterDao, FlumeComponentDao}
import com.directv.hw.persistence.entity.FlumeComponentEntity
import com.directv.hw.persistence.exception.OptimisticLockViolation
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}

import scala.collection.mutable
import scala.concurrent.Future
import scala.language.postfixOps

case class FlumeUpdateActorHolder(actor: ActorRef)

object FlumeUpdateActor {
  object UpdateAllClusters
  case class UpdateCluster(clusterPath: ClusterPath)
  case class UpdateFinished(clusterPath: ClusterPath)
}

class FlumeUpdateActor(implicit injector: Injector) extends Actor with Injectable with LazyLogging {

  private val platformManager = inject[PlatformManager]
  private val clustersInProgress = mutable.HashSet.empty[ClusterPath]
  private val flumeServiceRouter = inject[FlumeServiceRouter]
  private val flumeCompDao = inject[FlumeComponentDao]
  private val clusterDao = inject[ClusterDao]
  private val pluginRepo = inject[FlumeLocalRepo]
  private implicit val executionContext = inject[DispatcherFactory].auxiliaryDispatcher
  
  override def receive: Receive = {
    case UpdateAllClusters =>
      logger.debug("triggered flume component cache update")
      updateAllClusters()

    case UpdateFinished(path) =>
      logger.debug(s"flume component cache update finished for cluster: $path")
      clustersInProgress -= path

    case UpdateCluster(path) =>
      if (!clustersInProgress.contains(path)) {
        logger.debug(s"starting flume components update on $path")
        clustersInProgress += path
        updateCluster(path)
      } else {
        logger.debug(s"flume components update already started on $path")
      }
  }

  private def updateAllClusters() = {
    clusterDao.getAll.foreach { cluster =>
      self ! UpdateCluster(new ClusterPath(cluster.platformId, cluster.clusterId))
    }
  }

  private def updateCluster(clusterPath: ClusterPath): Unit = {
    Future {
      val startServiceUpdate = Instant.now().toEpochMilli
      val flumeServices = platformManager.getServices(clusterPath).filter(_.`type` == HadoopServiceTypes.flume)

      val serviceUpdates = flumeServices.map { service =>
        updateService(clusterPath, service)
      }

      Future.reduce(serviceUpdates)((a, b) => ()).foreach { unit =>
        self ! UpdateFinished(clusterPath)
      }

    }.recover {
      case e: Throwable =>
        logger.error("couldn't retrieve flume services", e)
        self ! UpdateFinished(clusterPath)
    }
  }

  private def updateService(clusterPath: ClusterPath, service: ServiceInfo): Future[Unit] = {
    Future {
      val startServiceUpdate = Instant.now().toEpochMilli
      val servicePath = new RelativeServicePath(clusterPath.clusterId, service.id)
      try {
        val flumeComponents = flumeServiceRouter.getFlumeService(clusterPath.platformId).listComponents(servicePath)
        logger.debug(s"found ${flumeComponents.size} flume component on $servicePath")
        flumeComponents.foreach { component =>
          try {
            flumeCompDao.optimisticSave {
              FlumeComponentEntity(
                clusterPath.platformId,
                clusterPath.clusterId,
                service.id,
                component.id,
                component.name,
                component.agentName,
                startServiceUpdate
              )
            }
          } catch {
            case e: OptimisticLockViolation =>
              logger.warn("component was updated before possibly via client. Ignoring this update.")
          }
        }

        flumeCompDao.findOlderThan(clusterPath, startServiceUpdate).foreach { component =>
          pluginRepo.deleteAgentFiles(modulePath(component))
          flumeCompDao.deleteComponent(modulePath(component))
        }

      } catch {
        case e: Throwable =>
          logger.error("couldn't retrieve flume components", e)
      }
    }
  }

  private def modulePath(component: FlumeComponentEntity): ModulePath = {
    new ModulePath(component.platformId, component.clusterId, component.serviceId, component.componentId)
  }
}
