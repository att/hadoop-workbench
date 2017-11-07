package com.directv.hw.hadoop.oozie.client

import com.directv.hw.hadoop.config.ConfigEntry
import com.directv.hw.hadoop.oozie.model.{OozieJobType, _}


trait OozieClient {
  def getWorkflowJobs(name: Option[String] = None,
                      offset: Option[Int] = None,
                      len: Option[Int] = None,
                      statuses: List[JobStatus.Value] = List.empty): List[WorkflowJob]

  def getCoordinatorJobs(name: Option[String] = None,
                         offset: Option[Int] = None,
                         len: Option[Int] = None,
                         statuses: List[JobStatus.Value] = List.empty): List[CoordinatorJob]

  def getWorkflowJob(jobId: String): WorkflowJob
  def getCoordinatorJob(jobId: String): CoordinatorJob
  def getJobDefinition(jobId: String): String
  def getJobLog(jobId: String): String
  def createJob(hdfsUrl: String,
                appPath: String,
                start: Boolean,
                properties: List[ConfigEntry] = List.empty,
                jobType: OozieJobType.Value): OozieJobId

  def startJob(jobId: String, hdfsUrl: String, appPath: String): Unit
  def suspendJob(jobId: String, hdfsUrl: String, appPath: String): Unit
  def resumeJob(jobId: String, hdfsUrl: String, appPath: String): Unit
  def killJob(jobId: String, hdfsUrl: String, appPath: String): Unit
  def rerunJob(jobId: String, hdfsUrl: String, appPath: String): Unit
  def dryrunJob(jobId: String, hdfsUrl: String, appPath: String): Unit
  def changeJob(jobId: String, hdfsUrl: String, appPath: String): Unit
}
