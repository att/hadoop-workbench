package com.directv.hw.common.graph

import org.scalatest.{FlatSpec, Matchers}

class GraphLayoutSpec extends FlatSpec with Matchers {
  "nodes" should "be positioned" in {
    val elements = List(1, 2, 3, 4, 5, 6, 7, 8, 9)
    val converter = new ElementConverter[Int, Int] {
      override def id(element: Int): Int = {
        element
      }

      override def childrenIds(element: Int): Traversable[Int] = {
        element match {
          case 1 => List(2, 4)
          case 2 => List(3, 5)
          case 4 => List(2)
          case _ => List()
        }
      }
    }

    val layout = new GraphLayout(elements, converter)
    val map = layout.position(Stacking.Sequential, Alignment.Begin, List(1, 4))

    map.get(1).get.depth should be(map.values.map(_.depth).min)
//    prettyPrint(map)
  }

  "nodes" should "be aligned" in {
    val elements = (2 to 20).toList
    val converter = new ElementConverter[Int, Int] {
      override def id(element: Int): Int = {
        element
      }

      override def childrenIds(element: Int): Traversable[Int] = {
        elements.filter(_ % element == 0)
      }
    }

    val layout = new GraphLayout(elements, converter)
    val map = layout.position(Stacking.Parallel, Alignment.End, List(6, 2, 3, 5))

    map.get(6).get.depth should be(2)
    map.get(2).get.depth should be(0)
    map.get(16).get.depth should be(3)
    map.get(11).get.depth should be(3)
//    prettyPrint(map)
  }

  private def prettyPrint[T](map: Map[T, GridPosition]) = {
    val (maxLength, maxWidth) = map.values.foldLeft((0, 0)) {
      (tuple, position) =>
        Math.max(tuple._1, position.depth) -> Math.max(tuple._2, position.offset)
    }
    val grid = Array.ofDim[String](maxLength + 1, maxWidth + 1)
    for (l <- 0 to maxLength) {
      for (w <- 0 to maxWidth) {
        grid(l)(w) = ""
      }
    }
    map.foldLeft(grid) { (grid: Array[Array[String]], entry) =>
      grid(entry._2.depth)(entry._2.offset) = entry._1.toString
      grid
    }

    for (w <- 0 to maxWidth) {
      for (l <- 0 to maxLength) {
        System.out.format("%3s", grid(l)(w))
      }
      System.out.println()
    }
    System.out.println()
  }
}
