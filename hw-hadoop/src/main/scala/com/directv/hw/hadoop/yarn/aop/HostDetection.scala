package com.directv.hw.hadoop.yarn.aop

import java.lang.reflect.{InvocationHandler, Method}

import com.directv.hw.core.exception.AccessException
import com.directv.hw.hadoop.config.{ClusterServiceNames, ClusterServiceResolver}
import com.directv.hw.hadoop.mapred.JobLog
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.hadoop.yarn.YarnClient
import com.directv.hw.persistence.dao.ClusterServiceDao
import com.directv.hw.persistence.entity.ClusterServiceEntity
import com.typesafe.scalalogging.LazyLogging

import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global

trait HostDetection extends InvocationHandler with LazyLogging {

  def yarnClient: YarnClient
  def serviceResolver: ClusterServiceResolver
  def clusterServiceDao: ClusterServiceDao
  def clusterPath: ClusterPath

  abstract override def invoke(proxy: Any, method: Method, args: Array[AnyRef]): AnyRef = {
    super.invoke(proxy, method, args) match {
      case x: Future[_] => x.recover {
        case e: AccessException =>
          logger.warn(s"Yarn log retrieving failed with error: '${e.getMessage}'. Trying to resolve active resource manager")

          def attempt(resourceManager: String) = {
            clusterServiceDao.saveService {
              ClusterServiceEntity (
                clusterPath.platformId,
                clusterPath.clusterId,
                ClusterServiceNames.resourceManager,
                resourceManager
              )
            }

            super.invoke(proxy, method, args)
          }

          firstSuccess(serviceResolver.resolveResourceManagers(clusterPath), attempt)
      }
    }
  }

  private def firstSuccess(resourceManagers: List[String], operation: String => AnyRef): AnyRef = {
    resourceManagers match {
      case Nil => throw new IllegalArgumentException("can not resolve resource manager http address")
      case head :: Nil =>
        operation(head)
      case head :: tail =>
        operation(head) match {
          case x: Future[_] => x.recover {
            case e: AccessException =>
              logger.warn(s"Yarn log retrieving failed with error: '${e.getMessage}'. Trying to resolve active resource manager")
              firstSuccess(tail, operation)
          }
        }
    }
  }
}
