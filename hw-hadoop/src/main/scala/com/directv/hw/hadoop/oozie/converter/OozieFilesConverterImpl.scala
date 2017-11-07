package com.directv.hw.hadoop.oozie.converter

import java.io.StringReader
import java.util.Properties

import com.directv.hw.common.web.CommonJsonFormats
import com.directv.hw.core.exception.{DapPluginException, ServerError}
import com.directv.hw.hadoop.config.{ConfigConverter, ConfigEntry, DescriptorConverter}
import com.directv.hw.hadoop.oozie.model.WorkflowGraph
import com.directv.hw.hadoop.oozie.service.{ConversionOptions, OozieFilesConverter, WorkflowParser}
import com.directv.hw.util.OrderedProperties
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}

import scala.collection.JavaConverters._

class OozieFilesConverterImpl(graphConverters: List[GraphToWorkflowConverter],
                              workflowConverters: List[WorkflowToGraphConverter])(implicit injector: Injector)
  extends OozieFilesConverter with Injectable with LazyLogging {

  private val configConverter = inject[ConfigConverter]
  private val simpleParser = inject[WorkflowParser]

  override def getSubtypeMetadata(version: String): String = findWorkflowConverter(version).getJsonSchemaAsString

  override def getSupportedWorkflowVersions: List[String] = workflowConverters.map(workflowConverter => workflowConverter.getSupportedWorkflowVersion)

  override def parseWorkflowXml(xml: String): WorkflowGraph = {

    val extVersion = simpleParser.getWorkflowInfoFromString(xml).map(_.version)
      .getOrElse(throw new ServerError(s"Cannot determine workflow version"))
    val converter = findWorkflowConverter(extVersion)
    converter.convertToGraph(xml)
  }

  override def marshalWorkflowGraph(graph: WorkflowGraph, options: ConversionOptions): String = {
    val converter = findGraphConverter(graph.version)
    converter.toWorkflowString(graph, options)
  }

  override def parseConfig(xml: String) = {
    if(xml matches "^\\s*$") {
      List.empty
    } else {
      configConverter.toConfig(xml)
    }
  }

  override def marshalConfig(entries: Iterable[ConfigEntry]) = configConverter.toConfigXml(entries)

  override def toProperties(text: String): List[ConfigEntry] = {
    val props = new OrderedProperties()
    props.load(new StringReader(text.replace("\\", "\\\\"))) // prevent backslash loss
    props.ordered.map { case (key, value) =>
      ConfigEntry(key, value, description = None, business = Some(true))
    }
  }

  override def toPropertiesText(entries: List[ConfigEntry]): String = {
    entries.map(e => s"${e.key}=${e.value}").mkString("\n")
  }

  override def convertNodeTemplate(nodeXml: String, version: String): String = {
    val converter = findWorkflowConverter(version)
    converter.convertNodeTemplate(nodeXml)
  }

  private def findWorkflowConverter(version: String) = {
    workflowConverters.find(_.getSupportedWorkflowVersion == version).getOrElse {
      throw new DapPluginException(s"findWorkflowConverter: Workflow version [$version] is not yet supported.")
    }
  }

  private def findGraphConverter(version: String) = {
    graphConverters.find(_.getSupportedWorkflowVersion == version).getOrElse {
      throw new DapPluginException(s"findGraphConverter: Workflow version [$version] is not yet supported.")
    }
  }
}
