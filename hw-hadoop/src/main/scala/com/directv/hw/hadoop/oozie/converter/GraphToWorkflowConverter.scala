package com.directv.hw.hadoop.oozie.converter

import java.io.ByteArrayOutputStream
import javax.xml.bind.{JAXBContext, Marshaller}

import com.directv.hw.core.exception.ServerError
import com.directv.hw.hadoop.oozie.model.{Connection, WorkflowGraph}
import com.directv.hw.hadoop.oozie.service.{ConversionOptions, WorkflowConverter}
import com.google.gson.GsonBuilder
import com.typesafe.scalalogging.LazyLogging
import org.apache.commons.lang3.StringEscapeUtils

import scala.xml._


trait GraphToWorkflowConverter extends LazyLogging {
  def getSupportedWorkflowVersion: String
  def toWorkflowString(graph: WorkflowGraph, options: ConversionOptions): String
}

abstract class GraphToWorkflowConverterBase extends GraphToWorkflowConverter with LazyLogging {
  protected type supportedType
  protected def supportedClass: Class[_]
  protected def toWorkflow(graph: WorkflowGraph, options: ConversionOptions): AnyRef
  protected def pluginDeserializers: List[(Class[_], Class[_])]

  def toWorkflowString(graph: WorkflowGraph, options: ConversionOptions): String = {
    validate(graph, options)
    val wfApp = toWorkflow(graph, options)
    val jaxbContext: JAXBContext = JAXBContext.newInstance(supportedClass)
    val jaxbMarshaller = jaxbContext.createMarshaller()
    jaxbMarshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, true)
    val os = new ByteArrayOutputStream
    jaxbMarshaller.marshal(wfApp, os)
    val workflowString = os.toString
    val wfNsXml = topNamespaces(Utility.trim(XML.loadString(workflowString)))
    val printer = new PrettyPrinter(32768, 4)
    StringEscapeUtils.unescapeXml(printer.format(wfNsXml))
  }

  // TODO (vkolischuk) create single Gson instance for all operations
  protected def fromJson[T](jsonVal: String, clazz: Class[T]): T = {
    val gsonBuilder: GsonBuilder = pluginDeserializers.foldLeft[GsonBuilder](new GsonBuilder()) {
      (builder: GsonBuilder, deserializer: (Class[_], Class[_])) =>
        builder.registerTypeAdapter(deserializer._1, deserializer._2.newInstance())
    }
    gsonBuilder.create().fromJson(jsonVal, clazz)
  }

  protected def findTarget(connections: List[Connection],
                           options: ConversionOptions,
                           node: com.directv.hw.hadoop.oozie.model.Node,
                           connector: Option[String] = None): String = {

    connections collectFirst {
      case c: Connection if c.from == node.id && (connector.isEmpty || c.connector == connector.get) => c.to
    } getOrElse {
      if(options.isStrict) {
        throw new ServerError(s"node ${node.id} missing outgoing connection(s)")
      } else {
        WorkflowConverter.emptyConnectionTarget
      }
    }
  }

  private def topNamespaces(node: Node, parentNs: String = "-#-"): Node = {
    node match {
      case elem: Elem =>
        elem.copy(
          scope = TopScope,
          prefix = null,
          attributes = {
            if (elem.namespace != parentNs) new UnprefixedAttribute("xmlns", elem.namespace, removeNamespacesFromAttributes(elem.attributes.filter(_.value.toString() != "")))
            else removeNamespacesFromAttributes(elem.attributes.filter(_.value.toString() != ""))
          },
        child = elem.child.map(c => topNamespaces(c, elem.namespace))
//        child = elem.child.collect{case c: Node if deepNonEmpty(c) => topNamespaces(c, elem.namespace)}
//         in order to save "propagate-configuration" and other FLAGs
        )
      case other => other
    }
  }

  private def deepNonEmpty(node: Node): Boolean = {
    if (node.attributes.nonEmpty || node.text.trim.nonEmpty) true
    else
    if (node.attributes.isEmpty && node.child.isEmpty) false
    else
      node.child.exists(childNode => deepNonEmpty(childNode))
  }

  private def removeNamespacesFromAttributes(metadata: MetaData): MetaData = {
    metadata match {
      case UnprefixedAttribute(k, v, n) => new UnprefixedAttribute(k, v, removeNamespacesFromAttributes(n))
      case PrefixedAttribute(pre, k, v, n) => new UnprefixedAttribute(k, v, removeNamespacesFromAttributes(n))
      case Null => Null
    }
  }

  private def validate(graph: WorkflowGraph, options: ConversionOptions) = {
    val starts = graph.nodes.filter(node => node.`type` == WorkflowConverter.Oozie.types.workflowControl && node.subtype == WorkflowConverter.Oozie.subtypes.start)
    if (starts.size > 1) {
      throw new ServerError(s"Multiple start nodes present")
    }

    val ends = graph.nodes.filter(node => node.`type` == WorkflowConverter.Oozie.types.workflowControl && node.subtype == WorkflowConverter.Oozie.subtypes.end)
    if (ends.size > 1) {
      throw new ServerError(s"Multiple endnodes present")
    }

    if (options.isStrict) {
      if (starts.isEmpty) {
        throw new ServerError(s"Start node is missing")
      }
      if (ends.isEmpty) {
        throw new ServerError(s"End node is missing")
      }
    }

    graph.nodes foreach { node =>
      if (node.`type` != WorkflowConverter.Oozie.types.workflowControl && node.subtype != WorkflowConverter.Oozie.subtypes.start) {
        if (!(node.id matches "^([a-zA-Z_]([\\-_a-zA-Z0-9])*){1,39}$")) {
          throw new ServerError(s"Invalid node name: ${node.id}")
        }
      }
    }
  }
}
