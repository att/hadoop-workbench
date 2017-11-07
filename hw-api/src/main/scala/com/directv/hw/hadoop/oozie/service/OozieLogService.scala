package com.directv.hw.hadoop.oozie.service

import com.directv.hw.hadoop.mapred.JobLog
import com.directv.hw.hadoop.model.ClusterPath

import scala.concurrent.Future

trait OozieLogService {

  def jobLog(clusterPath: ClusterPath, jobId: String)(user: String): String
  def actionLog(clusterPath: ClusterPath, jobId: String, actionId: String)(user:String): String
  def externalJobLog(clusterPath: ClusterPath, externalId: String): Future[List[JobLog]]
}
