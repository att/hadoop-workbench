package com.directv.hw.hadoop.oozie.converter

import java.io.{Reader, StringReader}
import javax.xml.bind.{JAXBContext, JAXBException}

import com.directv.hw.core.exception.CalleeException
import com.directv.hw.hadoop.oozie.model._
import com.directv.hw.hadoop.oozie.service.WorkflowConverter
import com.google.gson.{ExclusionStrategy, FieldAttributes, GsonBuilder}
import com.typesafe.scalalogging.LazyLogging


trait WorkflowToGraphConverter {
  def getSupportedWorkflowVersion: String
  def getJsonSchemaAsString: String
  def convertToGraph(xml: String): WorkflowGraph
  def convertNodeTemplate(nodeXml: String): String
}


private[converter] class TransitionSkipper extends ExclusionStrategy  {
  override def shouldSkipClass(c: Class[_]): Boolean = {
    c.getAnnotation(classOf[com.directv.hw.hadoop.oozie.bindings.JsonExclude]) != null
  }

  override def shouldSkipField(f: FieldAttributes): Boolean = {
    f.getAnnotation(classOf[com.directv.hw.hadoop.oozie.bindings.JsonExclude]) != null
  }
}

private[converter] case class CaseProps(`case`: String)

private[converter] case class ParsedWorkflow(name: String, nodes: List[AnyRef], propertiesForStartNode: Option[String])


abstract class WorkflowToGraphConverterBase extends WorkflowToGraphConverter with LazyLogging {
  protected def pluginSerializers: List[(Class[_], Class[_])]
  protected def getNodeBindings: List[Class[_]]
  protected def parse(xml: String): ParsedWorkflow
  protected def extractNode(record: AnyRef, propertiesForStartNode: Option[String]): Node
  protected def extractConnections(record: AnyRef): Option[List[Connection]]

  /**
   * Converts WORKFLOWAPP element (parsed from workflow.xml) to a graph model for passing to spray-json
   */
  override def convertToGraph(xml: String): WorkflowGraph = {
    val parsed = parse(xml)

    val nodes = parsed.nodes.map(extractNode(_, parsed.propertiesForStartNode))

    val connections: List[Connection] = parsed.nodes.flatMap(extractConnections).flatten filterNot (_.to == WorkflowConverter.emptyConnectionTarget)

    WorkflowGraph(parsed.name, getSupportedWorkflowVersion, nodes, connections)
  }

  protected def parseWorkflowString[T](xml: String, clazz: Class[T]): T = {
    try {
      val reader: Reader = new StringReader(xml)
      val jaxbContext: JAXBContext = JAXBContext.newInstance(clazz)
      logger.debug("context created")

      val unmarshaller = jaxbContext.createUnmarshaller()
      logger.debug("unmarshaller created")
      unmarshaller.unmarshal(reader).asInstanceOf[T]
    } catch {
      case e: JAXBException => throw new CalleeException("Unable to parse workflow xml", e)
      case e: Throwable => throw new CalleeException("Unable to read workflow xml", e)
    }
  }


  protected def getJson(value: AnyRef, pluginSerializers: List[(Class[_], Class[_])] = pluginSerializers): String = {
    val transitionSkipper = new TransitionSkipper

    val gsonBuilder: GsonBuilder = pluginSerializers.foldLeft[GsonBuilder](new GsonBuilder()) {
      (builder: GsonBuilder, serializer: (Class[_], Class[_])) =>
        builder.registerTypeAdapter(serializer._1, serializer._2.newInstance())
    }
    gsonBuilder.addSerializationExclusionStrategy(transitionSkipper).create().toJson(value)
  }


  override def convertNodeTemplate(nodeXml: String): String = {
    import scala.collection.JavaConversions._
    val xmlNode = try {
      val jaxbContext = JAXBContext.newInstance(getNodeBindings.toArray, Map[String, Object]())
      val unmarshaller = jaxbContext.createUnmarshaller()
      val reader = new StringReader(nodeXml)
      unmarshaller.unmarshal(reader)
    } catch {
      case e: JAXBException => throw new CalleeException("Unable to parse template", e)
      case e: Throwable => throw new CalleeException("Unable to read template", e)
    }
    getJson(xmlNode, allPluginSerializers)
  }

  private val allPluginSerializers: List[(Class[_], Class[_])] =
    com.directv.hw.hadoop.oozie.bindings.shell_action_0_3.pluginDescription.additionalSerializers ++
    com.directv.hw.hadoop.oozie.bindings.shell_action_0_2.pluginDescription.additionalSerializers ++
    com.directv.hw.hadoop.oozie.bindings.shell_action_0_1.pluginDescription.additionalSerializers ++
    com.directv.hw.hadoop.oozie.bindings.spark_action_0_1.pluginDescription.additionalSerializers ++
    com.directv.hw.hadoop.oozie.bindings.workflow_0_5.pluginDescription.additionalSerializers ++
    com.directv.hw.hadoop.oozie.bindings.ssh_action_0_2.pluginDescription.additionalSerializers ++
    com.directv.hw.hadoop.oozie.bindings.ssh_action_0_1.pluginDescription.additionalSerializers ++
    com.directv.hw.hadoop.oozie.bindings.sqoop_action_0_4.pluginDescription.additionalSerializers ++
    com.directv.hw.hadoop.oozie.bindings.sqoop_action_0_3.pluginDescription.additionalSerializers ++
    com.directv.hw.hadoop.oozie.bindings.sqoop_action_0_2.pluginDescription.additionalSerializers ++
    com.directv.hw.hadoop.oozie.bindings.distcp_action_0_2.pluginDescription.additionalSerializers ++
    com.directv.hw.hadoop.oozie.bindings.distcp_action_0_1.pluginDescription.additionalSerializers ++
    com.directv.hw.hadoop.oozie.bindings.email_action_0_2.pluginDescription.additionalSerializers ++
    com.directv.hw.hadoop.oozie.bindings.email_action_0_1.pluginDescription.additionalSerializers ++
    com.directv.hw.hadoop.oozie.bindings.hive_action_0_5.pluginDescription.additionalSerializers ++
    com.directv.hw.hadoop.oozie.bindings.hive_action_0_4.pluginDescription.additionalSerializers ++
    com.directv.hw.hadoop.oozie.bindings.hive_action_0_3.pluginDescription.additionalSerializers ++
    com.directv.hw.hadoop.oozie.bindings.hive_action_0_2.pluginDescription.additionalSerializers
}
