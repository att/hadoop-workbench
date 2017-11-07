package com.directv.hw.hadoop.oozie.service

import java.nio.file.Files

import com.directv.hw.common.io.DapIoUtils
import com.directv.hw.core.exception.{ConfigurationException, DapException, DeploymentException}
import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.access.AccessManagerService
import com.directv.hw.hadoop.config.MustacheProperty
import com.directv.hw.hadoop.files.{ComponentFS, ContentService}
import com.directv.hw.hadoop.hdfs.exception.HdfsFileNotFoundException
import com.directv.hw.hadoop.metrics.{MetricsAssignment, MetricsAssignmentRepo}
import com.directv.hw.hadoop.model._
import com.directv.hw.hadoop.oozie.model._
import com.directv.hw.hadoop.oozie.service.OozieFiles._
import com.directv.hw.hadoop.template.injest.oozie.model.OozieTemplate
import com.directv.hw.hadoop.template.injest.oozie.service.OozieComponentService
import com.directv.hw.hadoop.template.model.{ComponentDescriptor, ComponentInfo, UpdateTemplateInfo}
import com.directv.hw.persistence.dao.ClusterDao
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}

import scala.concurrent.Future
import scala.language.postfixOps

class OozieServiceImpl(implicit injector: Injector)
  extends OozieService with LazyLogging with Injectable {

  private val deploymentService = inject[OozieDeploymentService]
  private val componentService = inject[OozieComponentService]
  private val deploymentPersistenceService = inject[OozieDeploymentPersistenceService]
  private val componentPersistenceService = inject[OozieComponentPersistenceService]
  private val componentContentServiceFactory = inject[OozieComponentContentServiceFactory]
  private val accessService = inject[AccessManagerService]
  private val simpleParser = inject[WorkflowParser]
  private val metricsAssignmnetRepo = inject[MetricsAssignmentRepo]
  private val appConf = inject[AppConf]
  private val clusterDao = inject[ClusterDao]

  private lazy val typeMetadata = DapIoUtils.loadResourceAsString(getClass, "oozie.metadata/types.json")
  private lazy val connectionsMetadata = DapIoUtils.loadResourceAsString(getClass, "oozie.metadata/connections.json")

  override def getSubtypeMetadata(version: String): String = deploymentService.getSubtypeMetadata(version)

  override def getTypeMetadata(version: String): String = typeMetadata

  override def getConnectionsMetadata(version: String): String = connectionsMetadata

  override def getSupportedWorkflowVersions: List[String] = deploymentService.getSupportedWorkflowVersions

  override def getDeployments(clusterPath: ClusterPath): List[OozieDeployment] = {
    deploymentService.getDeployments(clusterPath)
  }

  override def getDeployment(modulePath: ModulePath, userName: String): OozieDeploymentInfo = {
    val fileService = deploymentService.getFileService(modulePath, modulePath.moduleId, userName)
    val files = fileService.listFiles(from = ComponentFS.root, includeDirectories = true, depth = ComponentFS.withChildren)
    if(files.nonEmpty) {
      deploymentService.getDeploymentInfo(modulePath, modulePath.moduleId, userName)
    } else {
      deploymentService.removeWorkflowFromCache(modulePath)
      throw new DapException(s"Workflow does not exist: ${modulePath.moduleId}")
    }
  }

  override def updateDeployment(hdfsPath: HdfsPath, info: OozieDeploymentUpdate, user: String): Unit = {
    deploymentService.updateDeployment(hdfsPath, info, user)
  }

  override def deployByEnv(templateId: Int, clusterPath: ClusterPath, env: String, user: String): DeploymentResult = {
    val standardEnv = appConf.cicdEnvMap.getOrElse(env, env)
    val clusterProps = accessService.findCustomClusterProperties(clusterPath)
    val appPath = clusterProps.find(_.key == "hdfs.app.path")
      .map(_.value)
      .getOrElse(appConf.hdfsAppPath)

    val basepath = clusterProps.find(_.key == s"${standardEnv}_basepath").getOrElse {
      throw ConfigurationException(s"Base path is not defined for env: $standardEnv")
    }

    val hdfsPath = new HdfsPath(clusterPath.platformId, clusterPath.clusterId, s"${basepath.value}/$appPath")
    deploy(templateId, hdfsPath, Some(standardEnv), user)
  }

  override def deployByPath(templateId: Int, hdfsPath: HdfsPath, user: String): DeploymentResult = {
    if (!hdfsPath.path.startsWith("/")) {
      throw new IllegalArgumentException(s"Hdfs path must start with '/': ${hdfsPath.path}")
    }

    deploy(templateId, hdfsPath, None, user)
  }

  private def deploy(templateId: Int, basePath: HdfsPath, env: Option[String], user: String): DeploymentResult = {
    val info = componentService.getTemplate(templateId).info
    if (info.name.contains("?") || info.name.isEmpty ||
      info.version.contains("?") || info.version.isEmpty) {
      throw new DeploymentException("Component descriptor is not vaild")
    }

    val path = s"${basePath.path}/${info.name}/${info.version}".replace("//", "/")
    val appPath = new HdfsPath(basePath.platformId, basePath.clusterId, path)
    val deploymentFS = deploymentService.createDeployment(appPath, info, user, Some(templateId), env)
    val componentFS = componentService.getFileService(templateId)
    DapIoUtils.copyAll(componentFS, deploymentFS)
    val componentPath = new OoziePath(appPath.platformId, appPath.clusterId, path)
    val targetPersistence = new SimpleWorkflowPersistenceImpl(deploymentPersistenceService, componentPath, user)
    copyPersistedProperties(templateId, targetPersistence, user)
    deployTeamKeytab(appPath, info.team, deploymentFS)
    renderWorkflowFiles(componentPath, user)
  }

  private def deployTeamKeytab(clusterPath: ClusterPath, team: Option[String], fs: ComponentFS): Unit = {
    clusterDao.getClusterSettings(clusterPath).foreach { settings =>
      if (settings.kerberized && team.isDefined) {
        val (user, path) = accessService.getTeamCreds(clusterPath, team.get)
        if (path.isEmpty) throw ConfigurationException(s"Keytab is not confugured for user $user")
        val is = Files.newInputStream(path.get)
        val name = s"${OozieFiles.keysDir}/${team.get}.keytab"
        fs.writeFile(name, is)
      }
    }
  }

  override def renderMustache(modulePath: ModulePath, user: String): DeploymentResult = {
    renderWorkflowFiles(modulePath, user)
  }

  override def updateConfiguration(clusterPath: ClusterPath, user: String): Future[Unit] = {
    deploymentService.updateConfuguration(clusterPath, user)
  }

  override def validate(hdfsPath: HdfsPath, user: String): Unit = {
    val xml = deploymentService.getFileService(hdfsPath, hdfsPath.path(), user).getFileContent(OozieFiles.fileWorkflowXml)

    // validate parsing passes wihout exceptions
    deploymentService.getFilesConverter.parseWorkflowXml(xml)
  }

  override def delete(modulePath: ModulePath, userName: String): Unit = {
    deploymentService.deleteWorkflow(modulePath, userName)
    deploymentPersistenceService.deleteCoords(modulePath)
  }

  override def checkExistence(modulePath: ModulePath, userName: String): ExistenceCheckResult = {
    try {
      val result = deploymentService.getFileService(modulePath, modulePath.moduleId, userName).findFile(fileWorkflowXml) match {
        case Some(file) if file.`type` == ModuleFileCommon.file => "Y"
        case _ => "N"
      }
      ExistenceCheckResult(result)
    } catch {
      case _: HdfsFileNotFoundException =>
        ExistenceCheckResult("N")
      case e: Throwable =>
        val description = s"Unable to check workflow.xml at path [${modulePath.moduleId}]: ${e.getLocalizedMessage}"
        logger.info(description, e)
        ExistenceCheckResult("?", Some(description))
    }
  }

  override def findComponents(version: String): List[OozieTemplate] = {
    componentService.findTemplates(version)
  }

  override def getComponent(id: Int): ComponentInfo = {
    componentService.getTemplate(id).info
  }

  override def createComponent(request: CreateWorkflowTemplateRequest, user: String): OozieTemplate = {
    val info = ComponentInfo(-1, request.tenantId, ComponentTypes.oozie, request.name, request.version, request.description)
    val reqTemplate = OozieTemplate(request.name, request.name, request.workflowVersion, info)
    val createdTemplate = if(request.templateId.nonEmpty) {
      val sourceId = request.templateId.get

      val sourceTemplate = componentService.getTemplate(sourceId)
      val sourceContent = {
        componentContentServiceFactory.getService(sourceId, user)
          .getFileContent(fileWorkflowXml, Some(FileFormat.workflow))
      }

      val sourceInfo = simpleParser.getWorkflowInfoFromString(sourceContent.text.get)

      val template = componentService.copyTemplate(sourceId, reqTemplate)

      sourceInfo.foreach { info =>
        if (request.workflowName != info.name || request.workflowVersion != sourceTemplate.workflowVersion) {
          val sourceGraph = sourceContent.content.get.asInstanceOf[WebWorkflowGraph]
          val targetGraph = sourceGraph.copy(name = request.workflowName)
          val targetContent = sourceContent.copy(content = Some(targetGraph))
          componentContentServiceFactory.getService(template.info.id, user).saveFileContent(fileWorkflowXml, targetContent)
        }
      }

      val targetPersistence = new SimpleWorkflowTemplatePersistenceImpl(componentPersistenceService, template.info.id, user)
      copyPersistedProperties(template.info.id, targetPersistence, user)
      template
    } else {
      val template = componentService.createTemplate(reqTemplate)
      val fileService = componentContentServiceFactory.getService(template.info.id, user)
      writeEmptyWorkflow(request.workflowName, request.workflowVersion, fileService, user)
      template
    }


    val descriptor = ComponentDescriptor (
      ComponentTypes.oozie,
      artifactId = Some(request.name), name = None,
      version = Some(request.version)
    )

    componentService.saveDescriptor(createdTemplate.info.id, descriptor)
    createdTemplate
  }

  override def updateComponentInfo(templateId: Int, info: UpdateTemplateInfo, user: String): Unit = {
    val descriptor = componentService.readDescriptor(templateId).map {
      _.copy (
        artifactId = Some(info.name),
        name = Some(info.name),
        version = Some(info.version),
        description = info.description,
        team = info.team
      )
    }.getOrElse {
      ComponentDescriptor (
        ComponentTypes.oozie,
        name = Some(info.name),
        artifactId = Some(info.name),
        version = Some(info.version),
        description = info.description,
        team = info.team
      )
    }

    componentService.saveDescriptor(templateId, descriptor)
    componentService.updateComponentInfo(templateId, info)
  }

  override def mustacheProperties: List[MustacheProperty] = {
    componentService.mustacheProperties
  }

  override def getMetricsAssignments(modulePath: ModulePath): List[MetricsAssignment] = {
    metricsAssignmnetRepo.getAssignments(modulePath)
  }

  private def renderWorkflowFiles(modulePath: ModulePath, user: String) = {
    val renderingErrors = deploymentService.renderMustacheConfigValues(modulePath, user)
    val mustacheValueResolutionWarnings = renderingErrors.messages.map(DeploymentError)
    DeploymentResult(modulePath.moduleId,  mustacheValueResolutionWarnings)
  }

  private def writeEmptyWorkflow(name: String, version: String, fileService: ContentService, user: String): Unit = {
    val startNode = WebNode(WorkflowConverter.startNodeId, WorkflowConverter.Oozie.types.workflowControl, WorkflowConverter.Oozie.subtypes.start, version, "", Position(0, 0))
    val endNode = WebNode("end", WorkflowConverter.Oozie.types.workflowControl, WorkflowConverter.Oozie.subtypes.end, version, "", Position(0, 0))
    val emptyGraph = WebWorkflowGraph(name, None, version, List(startNode, endNode))
    val graphContent = FileContent(content = Some(emptyGraph))
    fileService.saveFileContent(OozieFiles.fileWorkflowXml, graphContent)

    val emptyConfig = WorkflowConfig(List.empty)
    val configContent = FileContent(content = Some(emptyConfig))
    fileService.saveFileContent(OozieFiles.fileConfigDefault, configContent)
  }

  private def copyPersistedProperties(templateId: Int, targetPersistence: SimpleWorkflowPersistence, user: String): Unit = {
    componentPersistenceService.findCoords(templateId) withFilter(_.userName == user) foreach { entry =>
      targetPersistence.saveCoords(entry.file, entry.value)
    }
  }
}

private[service] class SimpleWorkflowPersistenceImpl(service: OozieDeploymentPersistenceService, modulePath: ModulePath, userName: String)
  extends SimpleWorkflowPersistence {

  override def deleteCoords(file: String): Unit = service.deleteCoords(modulePath, file = file, userName = userName)
  override def saveCoords(file: String, coords: String): Unit = service.saveCoords(modulePath, file = file, userName = userName, coords)
  override def getCoords(file: String) = Option(service.getCoords(modulePath, file = file, userName = userName))
  override val displayName: String = modulePath.toString
}

private[service] class SimpleWorkflowTemplatePersistenceImpl(service: OozieComponentPersistenceService, templateId: Int, userName: String)
  extends SimpleWorkflowPersistence {

  override def deleteCoords(file: String): Unit = service.deleteCoords(templateId, file = file, userName = userName)
  override def saveCoords(file: String, coords: String): Unit = service.saveCoords(templateId, file = file, userName = userName, coords)
  override def getCoords(file: String) = Option(service.getCoords(templateId, file = file, userName = userName))
  override def displayName: String = templateId.toString
}
