package com.directv.hw.web.ingest.oozie.plugin

import com.directv.hw.common.web.{FilesRoute, WebCommon}
import com.directv.hw.core.auth.UserSecurityContext
import com.directv.hw.core.exception.ServerError
import com.directv.hw.hadoop.metrics.MetricsAssignmentList
import com.directv.hw.hadoop.model.{ClusterPath, HdfsPath, ModulePath}
import com.directv.hw.hadoop.oozie.model.{OozieDeploymentUpdate, OozieDeployments}
import com.directv.hw.hadoop.oozie.service.{OozieDeploymentContentServiceFactory, OozieService}
import scaldi.{Injectable, Injector}
import spray.http.StatusCodes
import spray.routing.Route

import scala.concurrent.ExecutionContext

trait WorkflowRoute {

  self: WebCommon with FilesRoute with OozieJsonFormats with Injectable =>

  protected implicit val diContext: Injector
  protected implicit val executionContext: ExecutionContext

  protected def oozieService: OozieService
  protected def deploymentContentServiceFactory: OozieDeploymentContentServiceFactory

  protected def workflowsRoute[T](clusterPath: ClusterPath, userContext: UserSecurityContext): Route = {
    pathEnd {
      get {
        complete(OozieDeployments(oozieService.getDeployments(clusterPath)))
      } ~
      put {
        complete(oozieService.updateConfiguration(clusterPath, userContext.user).map(_ => StatusCodes.OK))
      }
    } ~
    path(Rest) { path =>
      def appPath = new ModulePath(clusterPath.platformId, clusterPath.clusterId, "HDFS", decode(s"/$path"))
      def hdfsPath = new HdfsPath(clusterPath.platformId, clusterPath.clusterId, decode(s"/$path"))
      parameter("metrics") {
        case "assignments" => complete(MetricsAssignmentList(oozieService.getMetricsAssignments(appPath)))
        case _ => reject
      } ~
      parameter("mode") {
        case "exists" => get { complete(oozieService.checkExistence(appPath, userContext.user)) }
        case other => throw new ServerError(s"Unknown mode: $other")
      } ~
      parameter("operation") {
        case "validate" =>
          get {
            complete {
              oozieService.validate(hdfsPath, userContext.user)
              StatusCodes.OK
            }
          }
        case "render" => put { complete(oozieService.renderMustache(appPath, userContext.user)) }
        case _ => reject
      } ~
      simpleFilesRoute(userContext, deploymentContentServiceFactory.getService(appPath, userContext.user)) ~
      get { complete(oozieService.getDeployment(appPath, userContext.user)) } ~
      put {
        jsonEntity[OozieDeploymentUpdate] { info =>
          complete {
            oozieService.updateDeployment(hdfsPath, info, userContext.user)
            StatusCodes.OK
          }
        }
      } ~
      delete {
        complete {
          oozieService.delete(appPath, userContext.user)
          StatusCodes.OK
        }
      }
    }
  }
}