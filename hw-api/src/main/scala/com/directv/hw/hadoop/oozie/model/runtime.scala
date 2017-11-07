package com.directv.hw.hadoop.oozie.model

case class OozieAction(id: String,
                       name: String,
                      `type`: String,
                       startTime: Option[String],
                       endTime: Option[String],
                       externalId: Option[String],
                       status: String,
                       transition: Option[String],
                       errorCode: Option[String],
                       errorMessage: Option[String],
                       retries: Int,
                       runningTime: Option[Long] = None)

sealed trait OozieJob {
  def id: String
  def appName: String
  def appPath: Option[String]
  def parentId: Option[String]
  def createdTime: String
  def status: String
}


case class WorkflowJob(id: String,
                       appName: String,
                       appPath: Option[String],
                       user: String,
                       status: String,
                       createdTime: String,
                       startTime: Option[String],
                       endTime: Option[String],
                       run: Int,
                       actions: List[OozieAction],
                       parentId: Option[String],
                       externalId: Option[String],
                       subJobs: Map[String, WorkflowJob],
                       runningTime: Option[Long] = None) extends OozieJob

case class CoordinatorJob(id: String,
                          appName: String,
                          appPath: Option[String],
                          externalId: Option[String],
                          parentId: Option[String] = None,
                          user: String,
                          createdTime: String,
                          startTime: Option[String],
                          endTime: Option[String],
                          timeUnit: String,
                          nextMaterializedTime: Option[String],
                          status: String,
                          frequency: String,
                          lastAction: Option[String],
                          timeOut: Int) extends OozieJob

case class JobStatistics(running: Int, failed: Int, succeeded: Int, other: Int)
case class OozieRuntimeStatistics(workflow: JobStatistics, coordinator: JobStatistics)

case class OozieJobId(id: String)

case class JobPath(platfromId: Int, clusterId: String, path: String, name: String)