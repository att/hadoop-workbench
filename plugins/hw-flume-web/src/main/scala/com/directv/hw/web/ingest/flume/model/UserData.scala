package com.directv.hw.web.ingest.flume.model

case class NodeData(x: Int, y: Int)
case class UserData(nodeData: Map[String, NodeData], hasAbsoluteCoordinates: Boolean)
