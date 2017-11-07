package com.directv.hw.hadoop.oozie.service

import com.directv.hw.core.exception.{CalleeException, DeploymentException, NotFoundException}
import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.config.{DescriptorConverter, OozieConfigurationProcessor, RenderingErrors}
import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.hdfs.HdfsServiceFactory
import com.directv.hw.hadoop.oozie.model._
import com.directv.hw.hadoop.model._
import com.directv.hw.hadoop.oozie.file.OozieComponentHDFS
import com.directv.hw.hadoop.template.model.{ComponentDescriptor, ComponentInfo}
import com.directv.hw.persistence.dao.{HdfsAccessDao, OozieWorkflowDao}
import com.directv.hw.persistence.entity.{OozieWorkflowEntity, TemplateInfoEntity}
import com.typesafe.scalalogging.LazyLogging
import org.joda.time.DateTime
import scaldi.{Injectable, Injector}

import scala.concurrent.Future
import scala.language.postfixOps

class OozieDeploymentServiceImpl(implicit injector: Injector) extends OozieDeploymentService with Injectable with LazyLogging {

  private val appConf = inject[AppConf]
  private val hdfsDao = inject[HdfsAccessDao]
  private val hdfsFactory = inject[HdfsServiceFactory]
  private val workflowDao = inject[OozieWorkflowDao]
  private val coordinatorParser = inject[CoordinatorParser]
  private val converter = inject[OozieFilesConverter]
  private val mustacheConfigProcessor = inject[OozieConfigurationProcessor]
  private val descriptorConverter = inject[DescriptorConverter]

  override def createDeployment(hdfsPath: HdfsPath,
                                info: ComponentInfo,
                                user: String,
                                componentId: Option[Int],
                                env: Option[String]): ComponentFS = {

    workflowDao.saveWorkflow {
      OozieWorkflowEntity (
        hdfsPath.platformId,
        hdfsPath.clusterId,
        hdfsPath.path,
        info.name,
        info.version,
        env,
        DateTime.now(),
        componentId,
        info.team
      )
    }

    try {
      val fs = OozieComponentHDFS(hdfsPath, hdfsPath.path, user)
      if (!fs.createBaseDir()) {
        workflowDao.deleteWorkflow(hdfsPath, hdfsPath.path)
        throw new DeploymentException("Can not create base directory: " + hdfsPath.path)
      }

      fs
    } catch {
      case e: Exception =>
        workflowDao.deleteWorkflow(hdfsPath, hdfsPath.path)
        throw new DeploymentException("Can not create base directory: " + hdfsPath.path + ": " + e.getMessage, e)
    }
  }

  override def getDeployments(path: ClusterPath): List[OozieDeployment] = {
    workflowDao.getWorkflows(path).map { case (deployment, component) =>
      toServiceModel(deployment, component)
    }
  }

  override def getDeployments: List[OozieDeployment] = {
    workflowDao.getWorkflows.map { case (deployment, component) =>
      toServiceModel(deployment, component)
    }
  }

  override def getDeploymentInfo(clusterPath: ClusterPath, appPath: String, userName: String): OozieDeploymentInfo = {
    logger.debug(s"refreshing workflow [$clusterPath$appPath]")
    val info = readDecriptor(clusterPath, appPath, userName)
    val prev = workflowDao.findWorkflow(clusterPath, appPath)

    val name = info.artifactId.orElse(info.name).getOrElse("???")
    val version = info.version.getOrElse("???")

    persistDeploymentCache {
      OozieWorkflowEntity (
        clusterPath.platformId,
        clusterPath.clusterId,
        appPath,
        name,
        version,
        prev.flatMap(_.env),
        DateTime.now(),
        prev.flatMap(_.componentId),
        info.team
      )
    }

    OozieDeploymentInfo (
      clusterPath.platformId,
      clusterPath.clusterId,
      appPath,
      name,
      version,
      prev.flatMap(_.componentId),
      prev.flatMap(_.env),
      info.team
    )
  }

  override def updateDeployment(hdfsPath: HdfsPath, update: OozieDeploymentUpdate, user: String): Unit = {
    val fileService = getFileService(hdfsPath, hdfsPath.path, user)
    val descriptor = readDecriptor(hdfsPath, hdfsPath.path, user)
    val updatedDescriptor = descriptorConverter.marshall(descriptor.copy(team = update.team))
    fileService.saveFileContent(OozieFiles.descriptor, updatedDescriptor)
    workflowDao.updateWorkflow(hdfsPath, update)
  }

  private def readDecriptor(clusterPath: ClusterPath, appPath: String, user: String): ComponentDescriptor = {
    val fileService = getFileService(clusterPath, appPath, user)
    fileService.tryFileContent(OozieFiles.descriptor).map(descriptorConverter.parse) match {
      case Some(descriptor) =>
        descriptor
      case None =>
        workflowDao.deleteWorkflow(clusterPath, appPath)
        throw new NotFoundException("Component was not found in " + appPath)
    }
  }

  override def getCoordinatorInfo(hdfsPath: HdfsPath, user: String): AppInfo = {
    val fileService = getFileService(hdfsPath, hdfsPath.path, user)
    val xml = fileService.getFileContent(OozieFiles.coordinatorXml)
    coordinatorParser.parseInfo(xml)
  }

  override def removeDeploymentsBefore(clusterPath: ClusterPath, startTime: DateTime): Unit = {
    workflowDao.deleteWorkflowsBefore(clusterPath, startTime)
  }

  private def persistDeploymentCache(deployment: OozieWorkflowEntity): Unit = {
    logger.debug(s"Updating oozie deployment cache: ${deployment.platformId}/${deployment.clusterId}/${deployment.path}")
    workflowDao.saveWorkflow {deployment}
  }

  private def toServiceModel(deployment: OozieWorkflowEntity, component: Option[TemplateInfoEntity]): OozieDeployment = {
    OozieDeployment (
      deployment.platformId,
      deployment.clusterId,
      deployment.path,
      deployment.name,
      deployment.name,
      deployment.version,
      component.map(toServiceModel)
    )
  }

  private def toServiceModel(entity: TemplateInfoEntity): OozieComponent = {
    OozieComponent (
      entity.id.get,
      entity.name,
      entity.description,
      entity.version,
      entity.tenantId
    )
  }

  override def deleteWorkflow(modulePath: ModulePath, userName: String): Unit = {
    logger.debug(s"deleting workflow, module: [$modulePath], userName: [$userName]")
    val deployment = workflowDao.getWorkflow(modulePath, modulePath.moduleId)
    val hdfs = hdfsService(modulePath, userName, deployment.team)
    val result = hdfs.delete(modulePath.moduleId)
    if (!result) {
      throw new CalleeException(s"Could not delete path [${modulePath.moduleId}]")
    }

    removeWorkflowFromCache(modulePath)
    logger.debug("...deleted")
  }

  override def deleteWorkflows(clusterPath: ClusterPath, path: String): Unit = {
    workflowDao.deleteWorkflows(clusterPath, path)
  }

  override def removeWorkflowFromCache(modulePath: ModulePath): Unit = {
    workflowDao.deleteWorkflow(modulePath, modulePath.moduleId)
  }

  override def getFileService(clusterPath: ClusterPath, appPath: String, userName: String): ComponentFS = {
    OozieComponentHDFS(clusterPath, appPath, userName)
  }

  override def renderMustacheConfigValues(modulePath: ModulePath, user: String): RenderingErrors = {
    val fs = getFileService(modulePath, modulePath.moduleId, user)
    mustacheConfigProcessor.renderFiles(fs, modulePath)
  }

  override def updateConfuguration(clusterPath: ClusterPath, user: String): Future[Unit] = {
    mustacheConfigProcessor.updateConfiguration(clusterPath, user)
  }

  override def getSubtypeMetadata(version: String): String = converter.getSubtypeMetadata(version)

  override def getSupportedWorkflowVersions: List[String] = converter.getSupportedWorkflowVersions

  override def getAllHdfsPaths: List[ClusterPath] = {
    hdfsDao.findAll().map { access =>
      new ClusterPath(access.platformId, access.clusterId)
    }
  }

  override def getFilesConverter: OozieFilesConverter = converter

  override def getPropertyRenderer(fileService: ComponentFS) = new OoziePropertyRendererImpl(fileService)

  private def hdfsService(clusterPath: ClusterPath, userName: String, team: Option[String]) = {
    hdfsFactory.byTeam(clusterPath, team.getOrElse(appConf.defaultTeam))
  }
}
