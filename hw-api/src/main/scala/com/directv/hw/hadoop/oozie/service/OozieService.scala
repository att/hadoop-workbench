package com.directv.hw.hadoop.oozie.service

import com.directv.hw.hadoop.config.MustacheProperty
import com.directv.hw.hadoop.metrics.MetricsAssignment
import com.directv.hw.hadoop.model.{ClusterPath, HdfsPath, ModulePath}
import com.directv.hw.hadoop.oozie.model._
import com.directv.hw.hadoop.template.injest.oozie.model.OozieTemplate
import com.directv.hw.hadoop.template.model.{ComponentInfo, UpdateTemplateInfo}

import scala.concurrent.Future

trait OozieService {
  def getSubtypeMetadata(version: String): String
  def getTypeMetadata(version: String): String
  def getConnectionsMetadata(version: String): String
  def getSupportedWorkflowVersions: List[String]

  def findComponents(version: String): List[OozieTemplate]
  def getComponent(id: Int): ComponentInfo
  def createComponent(request: CreateWorkflowTemplateRequest, userName: String): OozieTemplate
  def updateComponentInfo(templateId: Int, info: UpdateTemplateInfo, userName: String)
  def deployByPath(templateId: Int, hdfsPath: HdfsPath, user: String): DeploymentResult
  def deployByEnv(templateId: Int, clusterPath: ClusterPath, space: String, user: String): DeploymentResult
  def mustacheProperties: List[MustacheProperty]

  def getDeployments(path: ClusterPath): List[OozieDeployment]
  def getDeployment(path: ModulePath, userName: String): OozieDeploymentInfo
  def updateDeployment(hdfsPath: HdfsPath, info: OozieDeploymentUpdate, user: String): Unit
  def validate(path: HdfsPath, user: String): Unit
  def renderMustache(path: ModulePath, user: String): DeploymentResult
  def updateConfiguration(clusterPath: ClusterPath, user: String): Future[Unit]
  def delete(path: ModulePath, userName: String)
  def checkExistence(path: ModulePath, userName: String): ExistenceCheckResult
  def getMetricsAssignments(path: ModulePath): List[MetricsAssignment]
}