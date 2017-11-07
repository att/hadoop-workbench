package com.directv.hw.hadoop.oozie.service

import com.directv.hw.hadoop.oozie.model._
import com.directv.hw.hadoop.model.{ClusterPath, HdfsPath}

import scala.concurrent.Future

trait OozieRuntimeService {
  def getWorkflowJobs(hdfsPath: HdfsPath, user: String): Future[List[WorkflowJob]]
  def getCoordinatorJobs(hdfsPath: HdfsPath, user: String): Future[List[CoordinatorJob]]
  def getWorkflowJobStatistics(hdfsPath: HdfsPath, user: String): Future[JobStatistics]
  def getCoordinatorJobStatistics(hdfsPath: HdfsPath, user: String): Future[JobStatistics]

  def getJob(clusterPath: ClusterPath, jobId: String, user: String): OozieJob
  def getJobDefinition(clusterPath: ClusterPath, jobId: String, user: String): WorkflowGraph
  def createJob(clusterPath: ClusterPath, appPath: String, user: String, jobType: OozieJobType.Value): OozieJobId
  def killJobs(clusterPath: ClusterPath, appPath: String, user: String, jobType: OozieJobType.Value): Future[Unit]

  def startJob(clusterPath: ClusterPath, appPath: String, jobId: String, user: String): Unit
  def resumeJob(clusterPath: ClusterPath, appPath: String, jobId: String, user: String): Unit
  def suspendJob(clusterPath: ClusterPath, appPath: String, jobId: String, user: String): Unit
  def rerunJob(clusterPath: ClusterPath, appPath: String, jobId: String, user: String): Unit
  def killJob(clusterPath: ClusterPath, appPath: String, jobId: String, user: String): Unit
  def dryrunJob(clusterPath: ClusterPath, appPath: String, jobId: String, user: String): Unit
  def changeJob(clusterPath: ClusterPath, appPath: String, jobId: String, user: String): Unit
}