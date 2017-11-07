package com.directv.hw.hadoop.oozie.service

import com.directv.hw.common.graph.{Alignment, ElementConverter, GraphLayout, Stacking}
import com.directv.hw.hadoop.oozie.model._
import com.directv.hw.hadoop.oozie.service.WorkflowConverter.Oozie._
import com.typesafe.scalalogging.LazyLogging
import spray.json.DefaultJsonProtocol

import scala.language.postfixOps
import scala.util.Try
import scala.util.control.NonFatal


object PositioningType {
  val positionAbsolute = "absolute"
  val positionGrid = "grid"
}

class WorkflowWebConverterImpl extends WorkflowWebConverter with DefaultJsonProtocol with LazyLogging {
  import spray.json._

  case class NodeWoProperties(id: String, `type`: String, subtype: String, version: String, position: Position)

  private implicit val positionFormat: RootJsonFormat[Position] = jsonFormat2(Position)
  private implicit val nodeWoPropertiesFormat: RootJsonFormat[NodeWoProperties] = jsonFormat5(NodeWoProperties)


  override def toWebModel(graph: WorkflowGraph,
                          renderedName: Option[String],
                          file: String,
                          persistence: Option[SimpleWorkflowPersistence]): WebWorkflowGraph = {

    val nodes = graph.nodes
    val connections = graph.connections

    val (positions, visualProperties) = persistence.flatMap { persistence =>
      Try {
        persistence.getCoords(file) flatMap { persisted =>
          val coordinatesMapOpt = resolveDbCoordinates(nodes, persisted)
          if(coordinatesMapOpt.isEmpty) {
            persistence.deleteCoords(file)
          }
          coordinatesMapOpt
        }
      } recover {
        case NonFatal(e) =>
          logger.error(s"Unable to get workflow coordinates for [${persistence.displayName}] from DB", e)
          None
      } get
    }.fold(gridPositions(nodes, connections) -> VisualProperties(PositioningType.positionGrid))(_ -> VisualProperties(PositioningType.positionAbsolute))

    val webNodes = nodes map { node =>
      WebNode(node.id, node.`type`, node.subtype, node.version, node.properties, positions(node))
    }

    val webConnections = connections map (c => WebConnection(c.from, c.to, c.connector, c.properties))
    WebWorkflowGraph(graph.name, renderedName, graph.version, webNodes, webConnections, Some(visualProperties))
  }

  private def resolveDbCoordinates(nodes: List[Node], persisted: String): Option[Map[Node, Position]] = {
    val dbNodes = persisted.parseJson.convertTo[List[NodeWoProperties]]
    if(nodes.size == dbNodes.size) {
      val (persistedStarts, persistedRegularNodes) = dbNodes partition (n => n.`type` == types.workflowControl && n.subtype == subtypes.start)
      val byId = persistedRegularNodes map (n => n.id -> n) toMap

      val matchingPositions = nodes map {
        case start if start.`type` == types.workflowControl && start.subtype == subtypes.start =>
          start -> persistedStarts.headOption.map(_.position)
        case regular =>
          regular -> (byId.get(regular.id) collect {
            case n if regular.`type` == n.`type` && regular.subtype == n.subtype => n.position
          })
      } collect {
        case (node, Some(position)) => node -> position
      } toMap

      if (matchingPositions.size == nodes.size) {
        Some(matchingPositions)
      } else {
        None
      }
    } else {
      None
    }
  }

  private def gridPositions(nodes: List[Node], connections: List[Connection]): Map[Node, Position] = {
    val converter = new ElementConverter[Node, String] {
      override def id(element: Node): String = element.id
      override def childrenIds(element: Node): Traversable[String] = connections withFilter(_.from == element.id) map(_.to)
    }
    val roots = nodes.filter { node =>
      node.`type` == "workflow-control" && node.subtype == "start"
    }
    val layout = new GraphLayout(nodes, converter)
    layout.position(Stacking.Sequential, Alignment.Center, roots).map {
      case (node, gridPos) => node -> Position(gridPos.depth, gridPos.offset)
    }
  }

  override def toServiceModel(graph: WebWorkflowGraph, file: String, persistence: Option[SimpleWorkflowPersistence]): WorkflowGraph = {
    persistence foreach { persistence =>
      graph.visualProperties collect {
        case properties if properties.positionType == PositioningType.positionAbsolute =>
          val nodesWoProperties = graph.nodes map { node =>
            NodeWoProperties(node.id, node.`type`, node.subtype, node.version, node.position)
          }
          persistence.saveCoords(file, nodesWoProperties.toJson.compactPrint)
      }
    }

    val nodes = graph.nodes map (n => Node(n.id, n.`type`, n.subtype, n.version, n.properties))
    val connections = graph.connections map (c => Connection(c.from, c.to, c.connector, c.properties))
    WorkflowGraph(graph.name, graph.version, nodes, connections)
  }

}