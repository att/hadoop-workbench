package com.directv.hw.hadoop.oozie.service

import com.directv.hw.common.web.ContentServiceBase
import com.directv.hw.core.exception.{NotSupportedException, ServerError}
import com.directv.hw.core.service.Overwrite
import com.directv.hw.hadoop.model._
import com.directv.hw.hadoop.oozie.model.{FileFormat, WebWorkflowGraph, WorkflowConfig}
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}

import scala.language.postfixOps

abstract class OozieContentService(user: String)(implicit injector: Injector) extends ContentServiceBase
  with Injectable with LazyLogging {

  protected val persistence: Option[SimpleWorkflowPersistence]
  protected val conversionOptions: ConversionOptions

  private val converter = inject[OozieFilesConverter]
  private val webConverter = inject[WorkflowWebConverter]
  private lazy val propertyRenderer: OoziePropertyRenderer = {
    inject[OozieDeploymentService].getPropertyRenderer(fileService).addProperties(ModuleFileCommon.root)
  }

  override def convert(rawPath: String, text: String, format: String): ParsedContent = {
    val file = resolve(rawPath)
    doConvert(file, text, format, None)
  }

  override def getFileContent(rawPath: String, format: Option[String]): FileContent = {
    val file = resolve(rawPath)
    val fileText = fileService.getFileContent(file)
    val parsed = format map (doConvert(file, fileText, _, persistence))
    FileContent(Some(fileText), parsed)
  }

  private def doConvert(rawPath: String, text: String, format: String, persistence: Option[SimpleWorkflowPersistence]): ParsedContent = {
    val file = resolve(rawPath)
    format match {
      case FileFormat.workflow => parseWfGraph(file, text, persistence)
      case FileFormat.properties | FileFormat.keyValue => parsePropertiesFile(file, text)
      case other => throw new NotSupportedException(s"Unknown format: $other")
    }
  }

  private def parseWfGraph(rawPath: String, text: String, persistence: Option[SimpleWorkflowPersistence]): ParsedContent = {
    val modelGraph = converter.parseWorkflowXml(text)
    webConverter.toWebModel(modelGraph, None, resolve(rawPath), persistence)
  }

  private def parsePropertiesFile(rawPath: String, text: String): ParsedContent = {
    val file = resolve(rawPath)
    val configEntries = file match {
      case xml if isConfigKeyValue(xml) =>
        converter.parseConfig(text)
      case props if isPropertiesKeyValue(props) =>
        converter.toProperties(text)
      case other =>
        logger.warn(s"Unknown file type [$other], treating as properties")
        converter.toProperties(text)
    }

    WorkflowConfig(configEntries)
  }

  override def convert(rawPath: String, content: ParsedContent): String = {
    val file = resolve(rawPath)
    doConvert(file, content, None)
  }

  override def saveFileContent(rawPath: String, content: FileContent, overwrite: Overwrite): Unit = {
    val file = resolve(rawPath)
    val text = content.content map (doConvert(file, _, persistence)) orElse content.text getOrElse (throw new ServerError(s"Content not found"))
    fileService.saveFileContent(file, text, overwrite)
  }

  private def doConvert(rawPath: String, content: ParsedContent, persistence: Option[SimpleWorkflowPersistence]): String = {
    val file = resolve(rawPath)
    content match {
      case graph: WebWorkflowGraph =>
        marshalWorkflow(file, graph, persistence)
      case config: WorkflowConfig =>
        marshalProperties(file, config)
      case _ =>
        logger.error(s"Unknown content format: [$content]")
        throw new NotSupportedException(s"Unknown content format")
    }
  }

  private def marshalWorkflow(filePath: String, graph: WebWorkflowGraph, persistence: Option[SimpleWorkflowPersistence]): String  = {
    val model = webConverter.toServiceModel(graph, filePath, persistence)
    converter.marshalWorkflowGraph(model, conversionOptions)
  }

  private def marshalProperties(path: String, config: WorkflowConfig): String = {
    path match {
      case filePath if isConfigKeyValue(filePath) =>
        converter.marshalConfig(config.config)
      case filePath if isPropertiesKeyValue(filePath) =>
        converter.toPropertiesText(config.config)
      case other =>
        logger.warn(s"Unknown file type [$other], treating as properties")
        converter.toPropertiesText(config.config)
    }
  }

  private def resolve(file: String) = {
    if (file.matches(".*\\$\\{.*\\}.*")) {
      propertyRenderer.renderProperty(file)
    } else {
      file
    }

  }
  private def isConfigKeyValue(file: String) = file endsWith ".xml"
  private def isPropertiesKeyValue(file: String) = file endsWith ".properties"
}
