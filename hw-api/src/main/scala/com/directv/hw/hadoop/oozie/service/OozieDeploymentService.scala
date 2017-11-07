package com.directv.hw.hadoop.oozie.service

import com.directv.hw.hadoop.config.RenderingErrors
import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.oozie.model._
import com.directv.hw.hadoop.model.{ClusterPath, HdfsPath, ModulePath}
import com.directv.hw.hadoop.template.model.ComponentInfo
import org.joda.time.DateTime

import scala.concurrent.Future

trait OozieDeploymentService {

  def createDeployment(hdfsPath: HdfsPath,
                       info: ComponentInfo,
                       user: String,
                       componentId: Option[Int] = None,
                       env: Option[String] = None): ComponentFS

  def getDeployments(path: ClusterPath): List[OozieDeployment]
  def getDeployments: List[OozieDeployment]
  def getDeploymentInfo(clusterPath: ClusterPath, appPath: String, userName: String): OozieDeploymentInfo
  def updateDeployment(hdfsPath: HdfsPath, update: OozieDeploymentUpdate, user: String)
  def getCoordinatorInfo(hdfsPath: HdfsPath, user: String): AppInfo
  def removeDeploymentsBefore(clusterPath: ClusterPath, startTime: DateTime)
  def deleteWorkflow(modulePath: ModulePath, user: String)
  def deleteWorkflows(clusterPath: ClusterPath, path: String)
  def removeWorkflowFromCache(modulePath: ModulePath)

  def renderMustacheConfigValues(modulePath: ModulePath, user: String): RenderingErrors
  def updateConfuguration(clusterPath: ClusterPath, user: String): Future[Unit]
  def getFileService(clusterPath: ClusterPath, appPath: String, userName: String): ComponentFS
  def getSupportedWorkflowVersions: List[String]
  def getSubtypeMetadata(version: String): String

  def getFilesConverter: OozieFilesConverter
  def getPropertyRenderer(fileService: ComponentFS): OoziePropertyRenderer
  def getAllHdfsPaths: List[ClusterPath]
}
