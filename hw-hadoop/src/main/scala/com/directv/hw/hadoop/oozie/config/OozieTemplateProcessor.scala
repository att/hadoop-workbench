package com.directv.hw.hadoop.oozie.config

import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.access.AccessManagerService
import com.directv.hw.hadoop.config._
import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.files.exception.NotFoundException
import com.directv.hw.hadoop.hdfs.exception.HdfsFileNotFoundException
import com.directv.hw.hadoop.model.{ClusterPath, HdfsPath, ModuleFileCommon, ModulePath}
import com.directv.hw.hadoop.oozie.file.OozieComponentHDFS
import com.directv.hw.hadoop.oozie.service.{OozieFiles, OozieFilesConverter}
import com.directv.hw.persistence.dao.{ClusterDao, CustomClusterDataDao, OozieWorkflowDao}
import com.directv.hw.util.EnumObject
import com.typesafe.scalalogging.LazyLogging
import scaldi.Injector

import scala.concurrent.Future
import scala.xml.XML

object OozieMustacheProperties extends EnumObject[MustacheProperty] {
  val oozieWorkflowAppPath: MustacheProperty = register(MustacheProperty("oozie.workflow.app.path"))
  val coordWorkflowAppPath: MustacheProperty = register(MustacheProperty("coord.workflow.app.path"))
  val basepath: MustacheProperty = register(MustacheProperty("basepath"))
  val teamPrincipal: MustacheProperty = register(MustacheProperty("team.principal"))
  val keyTabPath: MustacheProperty = register(MustacheProperty("team.keytab.path"))
}

class OozieTemplateProcessor(implicit injector: Injector) extends AbstractTemplateProcessor
  with OozieConfigurationProcessor with LazyLogging {

  private val converter = inject[OozieFilesConverter]
  private val appConf = inject[AppConf]
  private val deploymentDao = inject[OozieWorkflowDao]
  private val clusterPropertiesDao = inject[CustomClusterDataDao]
  private val accessManager = inject[AccessManagerService]
  private val clusterDao = inject[ClusterDao]

  private implicit val dispatcher = inject[DispatcherFactory].auxiliaryDispatcher

  override def renderFiles(fileSystem: ComponentFS, modulePath: ModulePath): RenderingErrors = {
    val errors = super.renderFiles(fileSystem, modulePath)
    val hdfsPath = new HdfsPath(modulePath.platformId, modulePath.clusterId, modulePath.moduleId)
    val mustacheRenderingErrors = renderMustache(fileSystem, hdfsPath)
    renderFilesByKey(fileSystem, hdfsPath)
    errors.copy(messages = mustacheRenderingErrors ::: errors.messages)
  }

  override def updateConfiguration(clusterPath: ClusterPath, user: String): Future[Unit] = {
    val updates = deploymentDao.getWorkflows(clusterPath).map { workflow =>
      Future {
        val fs = OozieComponentHDFS(clusterPath, workflow._1.path, user)
        val hdfsPath = clusterPath.toHdfsPath(workflow._1.path)
        renderFilesByKey(fs, hdfsPath)
      }
    }

    Future.reduce(updates)( (update1, update2) => update1 )
  }

  private def renderFilesByKey(fileSystem: ComponentFS, hdfsPath: HdfsPath): Unit= {
    val attributes = collectAttributes(hdfsPath)
    renderXmlConfigByKey(fileSystem, attributes, OozieFiles.fileConfigDefault)
    renderXmlConfigByKey(fileSystem, attributes, OozieFiles.coordinatorConfig)
    renderXmlConfigByKey(fileSystem, attributes, OozieFiles.jobConfigXml)
    renderPropertyConfigByKey(fileSystem, attributes, OozieFiles.fileJobProperties)
    fileSystem.listFiles("conf").filter(_.path.endsWith(".properties")).foreach { file =>
      renderPropertyConfigByKey(fileSystem, attributes, file.path)
    }
  }

  private def renderXmlConfigByKey(fileSystem: ComponentFS, attributes: Map[String, () => Option[String]], file: String) = {
    safeRendering {
      val content = fileSystem.getFileContent(file)
      val properties = converter.parseConfig(content)
      val rendered = renderPropertiesByKey(properties, attributes)
      fileSystem.saveFileContent(file, converter.marshalConfig(rendered))
      List.empty
    }
  }

  private def renderPropertyConfigByKey(fileSystem: ComponentFS, attributes: Map[String, () => Option[String]], file: String) = {
    safeRendering {
      val content = fileSystem.getFileContent(file)
      val properties = converter.toProperties(content)
      val rendered = renderPropertiesByKey(properties, attributes)
      fileSystem.saveFileContent(file, converter.toPropertiesText(rendered))
      List.empty
    }
  }


  private def renderPropertiesByKey(properties: List[ConfigEntry], attributes: Map[String, () => Option[String]]) = {
    properties.map { prop =>
      attributes.get(prop.key).flatMap(_.apply()).map(value => prop.copy(value = value)).getOrElse(prop)
    }
  }

  private def renderMustache(fileSystem: ComponentFS, hdfsPath: HdfsPath): List[String] = {
    val attributes = collectAttributes(hdfsPath)
    val wfErrors =  safeRendering(renderWfRecursively(OozieFiles.fileWorkflowXml, fileSystem, attributes))
    val wfConfigErrors = safeXmlRendering(OozieFiles.fileConfigDefault, fileSystem, attributes)
    val confErrors = safeRendering {
      fileSystem.listFiles("conf").filter(_.`type` == ModuleFileCommon.file).flatMap { file =>
        val origProperties = fileSystem.getFileContent(file.path)
        val result = file.path match {
          case path if path.endsWith(".properties") => renderProperties(path, fileSystem, attributes)
          case _ => renderText(origProperties, attributes)
        }

        fileSystem.saveFileContent(file.path, result.rendered)
        result.errors
      }
    }

    val coordinatorErrors = renderCoordinatorFiles(fileSystem, attributes)
    wfErrors ++ wfConfigErrors ++ confErrors ++ coordinatorErrors
  }

  private def collectAttributes(hdfsPath: HdfsPath): Map[String, () => Option[String]] = {
    val clusterAttributes = mustacheDictionary.attributes(hdfsPath)
    val deployment = deploymentDao.findWorkflow(hdfsPath, hdfsPath.path).getOrElse {
      throw new IllegalStateException("oozie deployment was not found")
    }

    val customProperties = clusterPropertiesDao.findByCluster(hdfsPath)
    val basePath = deployment.env.flatMap(env => customProperties.find(_.key == env + "_basepath"))
      .map(_.value)
      .getOrElse {appConf.hdfsDefaultBasePath}

    val credentialsAttributes = clusterDao.getClusterSettings(hdfsPath).flatMap { settings =>
      if (settings.kerberized) {
        deployment.team.map { team =>
          val (user, _) = accessManager.getTeamCreds(hdfsPath, team)
          Map (
            OozieMustacheProperties.teamPrincipal -> user,
            OozieMustacheProperties.keyTabPath -> s"keys/$team.keytab"
          )
        }
      } else {
        None
      }
    }.getOrElse(Map.empty)

    val requiredAttributes = Map (
      OozieMustacheProperties.oozieWorkflowAppPath -> hdfsPath.path,
      OozieMustacheProperties.coordWorkflowAppPath -> hdfsPath.path,
      OozieMustacheProperties.basepath -> basePath
    )

    val oozieAttributes = (credentialsAttributes ++ requiredAttributes).map(entry => (entry._1.key, () =>  Some(entry._2)))
    clusterAttributes ++ oozieAttributes
  }

  private def renderProperties(path: String, fileSystem: ComponentFS, attributes: Map[String, () => Option[String]]) = {
    logger.debug(s"render properties file: $path")
    val content = fileSystem.getFileContent(path)
    val results = converter.toProperties(content).map { property =>
      val renderingResult = renderText(property.value, attributes)
      val renderedProperty = property.copy(value = renderingResult.rendered)
      RenderingResult(renderedProperty, renderingResult.errors)
    }

    val rendered = converter.toPropertiesText(results.map(_.rendered))
    val errors = results.flatMap(_.errors)
    RenderingResult(rendered, errors)
  }

  private def safeRendering(action: => List[String]): List[String] = {
    try {
      action
    } catch {
      case e: HdfsFileNotFoundException  =>
        logger.error("file was not found for rendering: " + e.getPath)
        List(e.getMessage)
      case e: NotFoundException =>
        logger.error("file was not found for rendering: " + e.getMessage)
        List(e.getMessage)
      case e: Exception =>
        logger.error("error rendering properties", e)
        List(e.getMessage)
    }
  }

  private def renderCoordinatorFiles(fs: ComponentFS, attributes: Map[String, () => Option[String]]) = {
    safeXmlRendering(OozieFiles.coordinatorXml, fs, attributes) ++
      safeXmlRendering(OozieFiles.coordinatorConfig, fs, attributes)
  }

  private def safeXmlRendering(path: String, fs: ComponentFS, attributes: Map[String, () => Option[String]]) = {
    fs.findFile(path).map { _ =>
      safeRendering {
        val result = renderXmlFile(fs.getFileContent(path), attributes)
        fs.saveFileContent(path, result.rendered)
        result.errors
      }
    }.getOrElse(List.empty)
  }

  protected def renderWfRecursively(path: String,
                                    fs: ComponentFS,
                                    attributes: Map[String, () => Option[String]]): List[String] = {
    try {
      val xml = fs.getFileContent(path)
      val result = renderXmlFile(xml, attributes)
      fs.saveFileContent(path, result.rendered)

      val subPaths = XML.loadString(xml) \ "action" \ "sub-workflow" \ "app-path"
      val subWorkflows = subPaths.map {
        _.text.replace("${wf:conf('oozie.wf.application.path')}/", "").trim
      }.filter(_.nonEmpty).toList

      subWorkflows.flatMap(renderWfRecursively(_, fs, attributes)) ::: result.errors
    } catch {
      case _: Exception =>
        logger.warn(s"error mustache rendering in workflow file [$path]")
        List.empty
    }
  }
}
