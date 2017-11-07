package com.directv.hw.hadoop.oozie.job

import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.hadoop.platform.PlatformTypes
import com.directv.hw.persistence.dao.PlatformDao
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}
import com.directv.hw.hadoop.mapred.JobLog

import scala.concurrent.{ExecutionContext, Future}

class ExternalLogAggregatorRouter(implicit injector: Injector) extends Injectable {

  private val platformDao = inject[PlatformDao]
  private val yarnLogAggregator = inject[YarnLogAggregator]

  def route(platformId: Int, jobId: String): ExternalLogAggregator  = {
    val platform = platformDao.findPlatformById(platformId)._1
    PlatformTypes.fromString(platform.`type`) match {
      case PlatformTypes.CDH => matchByCdhVersion(platform.version)
      case PlatformTypes.HDP => matchByHdpVersion(platform.version)
    }
  }

  private def matchByCdhVersion(version: String): ExternalLogAggregator = {
    version match {
      case v if v.matches("5.*") => yarnLogAggregator
      case _ => EmptyJobAggregator
    }
  }

  private def matchByHdpVersion(version: String): ExternalLogAggregator = {
    version match {
      case v if v.matches("2.*") => yarnLogAggregator
      case _ => EmptyJobAggregator
    }
  }
}

trait ExternalLogAggregator {
  def jobLog(clusterPath: ClusterPath, jobId: String): Future[List[JobLog]]
}

object EmptyJobAggregator extends ExternalLogAggregator with LazyLogging {
  import ExecutionContext.Implicits.global

  override def jobLog(clusterPath: ClusterPath, jobId: String): Future[List[JobLog]]  = {
    logger.warn(s"there is no external log aggregator for job id: [$jobId] on cluster $clusterPath")
    Future(List.empty)
  }
}
