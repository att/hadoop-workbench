package com.directv.hw.hadoop.oozie.job

import com.directv.hw.aop.Aspect
import com.directv.hw.hadoop.config.ClusterServiceResolver
import com.directv.hw.hadoop.mapred.JobLog
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.hadoop.yarn.YarnClient
import com.directv.hw.hadoop.yarn.aop.{HostDetection, YarnAspect}
import com.directv.hw.persistence.dao.ClusterServiceDao
import scaldi.{Injectable, Injector}

import scala.concurrent.Future

class YarnLogAggregator(implicit injector: Injector) extends ExternalLogAggregator with Injectable {

  private val yarnClient = inject[YarnClient]
  private val serviceResolver = inject[ClusterServiceResolver]
  private val clusterServiceDao = inject[ClusterServiceDao]

  override def jobLog(clusterPath: ClusterPath, jobId: String): Future[List[JobLog]] = {
    val handler = new YarnAspect(
      _:YarnClient,
      serviceResolver,
      clusterServiceDao,
      clusterPath) with HostDetection

    val proxy: YarnClient = Aspect.createProxy(yarnClient)(handler)
    proxy.jobLog(clusterPath, jobId)
  }
}
