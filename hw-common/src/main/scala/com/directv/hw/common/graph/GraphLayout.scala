package com.directv.hw.common.graph

import com.directv.hw.core.exception.ServerError

case class GridPosition(depth: Int, offset: Int)

trait ElementConverter[T, K] {
  def id(element: T): K

  def childrenIds(element: T): Traversable[K]
}

object Stacking extends Enumeration {
  type Stacking = Value

  val Parallel, Sequential = Value
}

object Alignment extends Enumeration {
  type Alignment = Value

  val Begin, Center, End = Value
}

class GraphLayout[T, K](elements: Traversable[T], converter: ElementConverter[T, K]) {

  import Alignment._
  import Stacking._

  private lazy val cache: Map[K, Node] = cacheNodes

  private def byId: K => Node = cache

  def position(stacking: Stacking = Parallel, alignment: Alignment = Begin, roots: Traversable[T] = List()): Map[T, GridPosition] = {
    val rootIds = roots.map(converter.id)
    rootIds.foreach { id =>
      if (!cache.contains(id)) {
        throw new ServerError(s"Unknown element with ID [$id]")
      }
    }

    val initialState = GroupState(State(cache.values.toSet, Map()), List(), rootIds.map(byId).toList)
    val positioned = positionGroups(initialState, stacking)

    val aligned = align(positioned, stacking, alignment)

    aligned.map { case (node, position) => node.value -> position }
  }


  case class Node(id: K, targets: Traversable[K], value: T)

  case class Size(depth: Int, offset: Int)

  case class Rectangle(position: GridPosition, size: Size)

  case class State(remaining: Set[Node], positions: Map[Node, GridPosition]) {
    def -(node: Node) = copy(remaining = remaining - node)

    def +(tuple: (Node, GridPosition)) = copy(positions = positions + (tuple._1 -> tuple._2))
  }

  case class PositioningResult(state: State, rectangle: Rectangle)

  case class Group(nodes: Traversable[Node], rectangle: Rectangle)

  case class GroupState(state: State, groups: List[Group], roots: List[Node])

  def positionGroups(groupState: GroupState, stacking: Stacking): GroupState = {
    if (groupState.state.remaining.isEmpty) {
      groupState
    } else {
      val root = groupState.roots.headOption.getOrElse(findRoot(groupState.state.remaining))
      val nextPosition = groupState.groups.lastOption.map {
        group =>
          val rectangle = group.rectangle
          stacking match {
            case Stacking.Parallel =>
              GridPosition(rectangle.position.depth, rectangle.position.offset + rectangle.size.offset)
            case Stacking.Sequential =>
              GridPosition(rectangle.position.depth + rectangle.size.depth, rectangle.position.offset)
          }
      }.getOrElse(GridPosition(0, 0))

      val positioningResult = positionNode(groupState.state, root, nextPosition)

      val nodes = groupState.state.remaining -- positioningResult.state.remaining
      val group = Group(nodes, positioningResult.rectangle)
      val roots = if (groupState.roots.nonEmpty) {
        groupState.roots.tail
      } else {
        List()
      }

      val resultState = new GroupState(positioningResult.state, groupState.groups :+ group, roots)
      positionGroups(resultState, stacking)
    }
  }

  private def positionNode(state: State, node: Node, nextPosition: GridPosition): PositioningResult = {
    if (!state.remaining.contains(node)) {
      PositioningResult(state, Rectangle(nextPosition, Size(0, 0)))
    } else {
      case class ChildrenResult(state: State, maxDepth: Int, totalOffset: Int)
      val beforeFirstChild = ChildrenResult(state - node, 0, 0)

      val childrenResult = node.targets.map(byId).filter(state.remaining.contains).foldLeft(beforeFirstChild) {
        (result: ChildrenResult, child: Node) =>
          val childNextPosition = GridPosition(nextPosition.depth + 1, nextPosition.offset + result.totalOffset)

          val childPositioning = positionNode(result.state, child, childNextPosition)

          val maxDepth = Math.max(result.maxDepth, childPositioning.rectangle.size.depth)
          val totalOffset = result.totalOffset + childPositioning.rectangle.size.offset

          ChildrenResult(childPositioning.state, maxDepth, totalOffset)
      }

      val totalDepth = childrenResult.maxDepth + 1
      val totalOffset = Math.max(childrenResult.totalOffset, 1)
      val totalRectangle = Rectangle(nextPosition, Size(totalDepth, totalOffset))

      val nodePosition = GridPosition(nextPosition.depth, nextPosition.offset + (totalOffset - 1) / 2)

      PositioningResult(childrenResult.state + (node -> nodePosition), totalRectangle)
    }
  }

  private def align(positioned: GroupState, stacking: Stacking, alignment: Alignment): Map[Node, GridPosition] = {
    alignment match {
      case Begin => positioned.state.positions
      case Center | End =>
        val maxLength = positioned.groups.foldLeft(0) { (max, group) =>
          val len = length(group.rectangle.size, stacking)
          Math.max(len, max)
        }

        positioned.groups.foldLeft(positioned.state.positions) { (positions, group) =>
          val delta = maxLength - length(group.rectangle.size, stacking)

          val translationalLenth = alignment match {
            case Center => delta / 2
            case End => delta
          }

          val translation = stacking match {
            case Parallel => Size(translationalLenth, 0)
            case Sequential => Size(0, translationalLenth)
          }

          translate(group, positions, translation)
        }
    }
  }

  private def length(size: Size, stacking: Stacking): Int = {
    stacking match {
      case Sequential => size.offset
      case Parallel => size.depth
    }
  }

  private def translate(group: Group, positions: Map[Node, GridPosition], delta: Size): Map[Node, GridPosition] = {
    if (delta.depth != 0 || delta.offset != 0) {
      group.nodes.foldLeft(positions) { (positions, node) =>
        val position = positions.get(node).get
        positions + (node -> GridPosition(position.depth + delta.depth, position.offset + delta.offset))
      }
    } else {
      positions
    }
  }

  private def findRoot(nodes: Set[Node]): Node = {
    val startIds = nodes.foldLeft(nodes.map(_.id)) { (set, node) =>
      set -- node.targets.toSet.intersect(nodes.map(_.id))
    }
    if (startIds.nonEmpty) {
      byId(startIds.head)
    } else {
      nodes.head
    }
  }

  private def cacheNodes: Map[K, Node] = {
    val exitingElementIds = elements.map(converter.id).toSet
    val map = elements.map { element =>
      val id = converter.id(element)
      val node = Node(id, converter.childrenIds(element).filter(exitingElementIds.contains), element)
      id -> node
    }.toMap
    if (map.size != elements.size) {
      val ids = (map.values.toSet -- elements).mkString(", ")
      throw new ServerError(s"Inconsistent model: elements missing. IDs not initially listed: [$ids]")
    }
    map
  }
}
