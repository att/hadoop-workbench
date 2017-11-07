package com.directv.hw.hadoop.oozie.model

import com.directv.hw.hadoop.mapred.JobLog
import com.directv.hw.hadoop.model.ParsedContent

case class WebConnection(from: String, to: String, connector: String, properties: String = "")

case class Position(x: Int, y: Int)

case class PropertyFile(title: String, link: String)

case class WebNode(id: String,
                   `type`: String,
                   subtype: String,
                   version: String,
                   properties: String,
                   position: Position,
                   propertyFiles: List[PropertyFile] = List.empty)


case class VisualProperties(positionType: String)

case class WebWorkflowGraph(name: String,
                            renderedName: Option[String],
                            version: String,
                            nodes: List[WebNode] = List.empty,
                            connections: List[WebConnection] = List.empty,
                            visualProperties: Option[VisualProperties] = None,
                            propertyFiles: List[PropertyFile] = List.empty) extends ParsedContent

case class JobLogList(logs: List[JobLog])
