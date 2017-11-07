package com.directv.hw.web.ingest.flume.service

import com.directv.hw.web.ingest.flume.model.{NodeData, UserData}
import org.scalatest.{FlatSpec, Matchers}

class FlumePersistenceServiceSpec extends FlatSpec with Matchers {
  "module data" should "be stored in DB" in {
    val nodeData1 = "id1" -> NodeData(10, 50)
    val nodeData2 = "id2" -> NodeData(672, 362)
    val nodeData3 = "id3" -> NodeData(673, 762)

    val moduleData = new UserData(Map(nodeData1, nodeData2, nodeData3), true)

//    val json = marshalModuleData(moduleData)
//
//    val restoredModuleData = unmarshalModuleData(json)
//
//    restoredModuleData.hasAbsoluteCoordinates should be (true)
//
//    restoredModuleData.nodeData should have size 3
//
//    List(nodeData1, nodeData2, nodeData3) foreach { verifyPosition(restoredModuleData.nodeData, _) }
  }

  private def createNode(id: String, x: Int, y: Int) = {
    id -> NodeData(x,y)
  }

  private def verifyPosition(map: Map[String, NodeData], node: (String, NodeData)) = {
    val restoredNode = map.get(node._1).get
    (restoredNode.x, restoredNode.y) should be (node._2.x, node._2.y)
  }
}
