package com.directv.hw.web.ingest.oozie.plugin

import com.directv.hw.common.web.WebCommon
import com.directv.hw.core.exception.ServerError
import com.directv.hw.hadoop.model.{ClusterPath, HdfsPath}
import com.directv.hw.hadoop.oozie.model.{JobLogList, OozieJobType, OozieRuntimeStatistics}
import com.directv.hw.hadoop.oozie.service.{OozieLogService, OozieRuntimeService, WorkflowWebConverter}
import com.directv.hw.web.ingest.oozie.model.{OozieJobs, OozieLog}
import scaldi.{Injectable, Injector}
import spray.http.StatusCodes
import spray.routing.Route

import scala.concurrent.ExecutionContext

trait JobsRoute {
  self: WebCommon with OozieJsonFormats with Injectable =>

  protected implicit val diContext: Injector
  protected implicit val executionContext: ExecutionContext

  protected val oozieRuntimeService: OozieRuntimeService
  protected val logService: OozieLogService
  protected val webConverter: WorkflowWebConverter

  protected def jobRoute(platformId: Int, clusterId: String)(user: String): Route = {
    val clusterPath = new ClusterPath(platformId, clusterId)
    parameter("appPath") { appPath =>
      val hdfsPath = new HdfsPath(clusterPath.platformId, clusterPath.clusterId, appPath)
      path("statistics") {
        get {
          complete {
            oozieRuntimeService.getWorkflowJobStatistics(hdfsPath, user).flatMap { wf =>
              oozieRuntimeService.getCoordinatorJobStatistics(hdfsPath, user).map { coordnator =>
                OozieRuntimeStatistics(wf, coordnator)
              }
            }
          }
        }
      } ~
      pathPrefix(Segment) { jobId =>
        pathEndOrSingleSlash {
          get {
            complete(oozieRuntimeService.getJob(clusterPath, jobId, user))
          }
        } ~
        pathPrefix("actions") {
          pathPrefix(Segment) { actionId =>
            get {
              path("log") {
                complete(OozieLog(logService.actionLog(clusterPath, jobId, actionId)(user)))
              } ~
              path("external-log") {
                complete(externalJobLog(clusterPath, actionId))
              }
            }
          }
        } ~
        path("definition") {
          get {
            complete {
              val model = oozieRuntimeService.getJobDefinition(clusterPath, jobId, user)

              // name already rendered
              webConverter.toWebModel(model, Some(model.name), "", None)
            }
          }
        } ~
        path("log") {
          get {
            complete {
              OozieLog(logService.jobLog(clusterPath, jobId)(user))
            }
          }
        } ~
        put {
          parameter("action") {
            case "start" =>
              complete {
                oozieRuntimeService.startJob(clusterPath, appPath, jobId, user)
                StatusCodes.OK
              }
            case "resume" =>
              complete {
                oozieRuntimeService.resumeJob(clusterPath, appPath, jobId, user)
                StatusCodes.OK
              }
            case "suspend" =>
              complete {
                oozieRuntimeService.suspendJob(clusterPath, appPath, jobId, user)
                StatusCodes.OK
              }
            case "rerun" =>
              complete {
                oozieRuntimeService.rerunJob(clusterPath, appPath, jobId, user)
                StatusCodes.OK
              }
            case "kill" =>
              complete {
                oozieRuntimeService.killJob(clusterPath, appPath, jobId, user)
                StatusCodes.OK
              }
            case "dryrun" =>
              complete {
                oozieRuntimeService.dryrunJob(clusterPath, appPath, jobId, user)
                StatusCodes.OK
              }
            case "change" =>
              complete {
                oozieRuntimeService.changeJob(clusterPath, appPath, jobId, user)
                StatusCodes.OK
              }
            case other => throw new ServerError(s"Unknown action: $other")
          }
        }
      } ~
      parameter('length.as[Int]? 20) { length =>
        get {
          complete {
            val workflowJobsFuture = oozieRuntimeService.getWorkflowJobs(hdfsPath, user).map(_.take(length))
            val coordinatorJobsFuture = oozieRuntimeService.getCoordinatorJobs(hdfsPath, user).map(_.take(length))
            workflowJobsFuture.flatMap { workflowJobs =>
              coordinatorJobsFuture.map { coordinatorJobs =>
                OozieJobs(workflowJobs, coordinatorJobs)
              }
            }
          }
        }
      } ~
      parameter('jobType? OozieJobType.workflow.toString) { jobType =>
        post {
          complete(oozieRuntimeService.createJob(clusterPath, appPath, user, jobType))
        } ~
        delete {
          complete {
            oozieRuntimeService.killJobs(clusterPath, appPath, user, jobType).map(_ => StatusCodes.OK)
          }
        }
      }
    }
  }

  private def externalJobLog(clusterPath: ClusterPath, externalId: String) = {
    val jobId = externalId.replace("job_", "")
    logService.externalJobLog(clusterPath, jobId).map(JobLogList)
  }
}