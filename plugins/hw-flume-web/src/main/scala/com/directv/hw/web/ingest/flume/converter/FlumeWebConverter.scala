package com.directv.hw.web.ingest.flume.converter

import com.directv.hw.common.graph.{Alignment, ElementConverter, GraphLayout, Stacking}
import com.directv.hw.core.exception.ServerError
import com.directv.hw.hadoop.flume.model._
import com.directv.hw.web.ingest.flume.model._

object FlumeWebConverter {
  val sourceType = "source"
  val channelType = "channel"
  val sinkType = "sink"
  val typeProp = "type"

  val positionTypeAbsolute = "absolute"
  val positionTypeGrid = "grid"
  val hasGridPosition = false
  val hasAbsolutePosition = true

  val defaultSourcePositionX = 0
  val defaultChannelPositionX = 1
  val defaultSinkPositionX = 2
}

trait FlumeWebConverter {
  def toGraph(flumeAgent: FlumePipeline, maybeModuleData: Option[UserData]): FlumeGraph

  def toFlumeAgent(graph: FlumeGraph): FlumePipeline

  def extractUserData(graph: FlumeGraph): Option[UserData]
}

class FlumeWebConverterImpl extends FlumeWebConverter {

  import com.directv.hw.web.ingest.flume.converter.FlumeWebConverter._



  override def toGraph(flumeAgent: FlumePipeline, maybeModuleData: Option[UserData]): FlumeGraph = {
    val moduleData = maybeModuleData.getOrElse(defaultPositions(flumeAgent))
    val visualProperties = new VisualProperties (
      if (moduleData.hasAbsoluteCoordinates) FlumeWebConverter.positionTypeAbsolute
      else FlumeWebConverter.positionTypeGrid
    )

    val sources = convertNodes(flumeAgent.sources, sourceType, moduleData.nodeData)
    val channels = convertNodes(flumeAgent.channels, channelType, moduleData.nodeData)
    val sinks = convertNodes(flumeAgent.sinks, sinkType, moduleData.nodeData)
    val connections = flumeAgent.connections.map(connection => toConnection(connection))

    FlumeGraph (
      flumeAgent.agentName,
      sources ++ channels ++ sinks,
      connections,
      Some(visualProperties)
    )
  }

  private def convertNodes(nodes: List[FlumeNode], nodeType: String, nodeData: Map[String, NodeData]) = {
    nodes.map(node => toNode(node, nodeType, nodeData.get(node.name).get))
  }

  private def toNode(flumeNode: FlumeNode, nodeType: String, nodeData: NodeData) = {
    Node(flumeNode.name, nodeType, flumeNode.nodeType, flumeNode.properties, toPosition(nodeData))
  }

  private def toPosition(nodeData: NodeData) = {
    Position(nodeData.x, nodeData.y)
  }

  private def toConnection(flumeConnection: FlumeConnection) = {
    Connection(flumeConnection.from, flumeConnection.to)
  }

  private def defaultPositions(flumeAgent: FlumePipeline): UserData = {
    val elements = flumeAgent.sources ++ flumeAgent.channels ++ flumeAgent.sinks
    val converter = new ElementConverter[FlumeNode, String] {
      override def id(element: FlumeNode): String = element.name

      override def childrenIds(element: FlumeNode): Traversable[String] = {
        flumeAgent.connections.filter(_.from == element.name).map(_.to)
      }
    }
    val layout = new GraphLayout(elements, converter)
    val map = layout.position(Stacking.Parallel, Alignment.Begin, elements).map {
      case (node, position) =>
        val x = node match {
          case s: FlumeSource => 0
          case c: FlumeChannel => 1
          case s: FlumeSink => 2
        }
        node.name -> NodeData(x, position.offset)
    }
    UserData(map, hasGridPosition)
  }



  override def toFlumeAgent(graph: FlumeGraph): FlumePipeline = {
    validateGraphInfo(graph)

    val sources = graph.nodes
      .withFilter(_.`type` == sourceType)
      .map(node => new FlumeSource(node.id, node.subtype, node.properties))

    val channels = graph.nodes
      .withFilter(_.`type` == channelType)
      .map(node => new FlumeChannel(node.id, node.subtype, node.properties))

    val sinks = graph.nodes
      .withFilter(_.`type` == sinkType)
      .map(node => new FlumeSink(node.id, node.subtype, node.properties))

    // TODO (vkolischuk): use map to optimize?
    def isPresent(nodes: List[FlumeNode], name: String) = nodes.exists(_.name == name)
    def isSource(name: String) = isPresent(sources, name)
    def isChannel(name: String) = isPresent(channels, name)
    def isSink(name: String) = isPresent(sinks, name)

    val connections = graph.connections.map { connection =>
      val from = connection.from
      val to = connection.to
      if ((isSource(from) && isChannel(to)) || (isChannel(from) && isSink(to))) {
        new FlumeConnection(connection.from, connection.to)
      } else {
        throw new ServerError(s"Illegal connection from [$from] to [$to]")
      }
    }

    new FlumePipeline(graph.agentName, sources, sinks, channels, connections)
  }

  private def validateGraphInfo(graph: FlumeGraph) = {
    if (graph.agentName.isEmpty) {
      throw new ServerError("Agent name is missing")
    }
    validateIdentifier(graph.agentName, "Agent name")

    graph.nodes.foreach(node => validateIdentifier(node.id, s"${node.`type`} component"))

    validateConnections(graph)
  }

  private def validateIdentifier(id: String, desc: String) = {
    if (!id.matches("[a-zA-Z_][a-zA-Z0-9_-]*")) {
      throw new ServerError(s"Invalid ID [$id] for $desc")
    }
  }

  private def validateConnections(graph: FlumeGraph) = {
    def validateMaxIncoming(nameTo: String, limit: Int) = {
      if (graph.connections.count(_.to == nameTo) > limit) {
        throw new ServerError(s"Too many incoming connections to node $nameTo")
      }
    }
    graph.nodes.foreach { node =>
      if (node.`type` == channelType || node.`type` == sinkType) {
        validateMaxIncoming(node.id, 1)
      }
      if (node.`type` == sourceType) {
        validateMaxIncoming(node.id, 0)
      }
    }
  }

  def extractUserData(graph: FlumeGraph): Option[UserData] = {
    graph.visualProperties.map { visualProperties =>
      val positions = graph.nodes.map { node => node.id -> NodeData(node.position.x, node.position.y) }.toMap
      UserData(positions, visualProperties.positionType == positionTypeAbsolute)
    }
  }
}
