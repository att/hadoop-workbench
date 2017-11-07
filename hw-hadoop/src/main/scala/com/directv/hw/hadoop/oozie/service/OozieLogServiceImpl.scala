package com.directv.hw.hadoop.oozie.service

import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.oozie.client.OozieClientRouter
import com.directv.hw.hadoop.oozie.job.{ExternalLogAggregatorRouter, LogParser}
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.hadoop.mapred.JobLog
import scaldi.{Injectable, Injector}

import scala.concurrent.Future

class OozieLogServiceImpl(implicit injector: Injector) extends OozieLogService with Injectable {

  private val oozieClientRouter = inject[OozieClientRouter]
  private val externalLogAggregatorRouter = inject[ExternalLogAggregatorRouter]
  private val appConf = inject[AppConf]

  override def jobLog(clusterPath: ClusterPath, jobId: String)(user: String): String = {
    retrieveJobLog(clusterPath, jobId, user)
  }

  override def actionLog(clusterPath: ClusterPath,
                         jobId: String,
                         actionId: String)(user: String): String = {

    val log = retrieveJobLog(clusterPath, jobId, user)
    LogParser(log).actionLog(actionId)
  }

  override def externalJobLog(clusterPath: ClusterPath, jobId: String): Future[List[JobLog]] = {
    externalLogAggregatorRouter.route(clusterPath.platformId, jobId).jobLog(clusterPath, jobId)
  }

  private def retrieveJobLog(clusterPath: ClusterPath, jobId: String, user: String): String = {
    val team = appConf.defaultTeam
    oozieClientRouter.getOozieClient(clusterPath, Some(team)).getJobLog(jobId)
  }
}
