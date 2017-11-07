package com.directv.hw.hadoop.oozie.model

case class Connection(from: String, to: String, connector: String, properties: String = "")

case class Node(id: String,
                `type`: String,
                subtype: String,
                version: String,
                properties: String)

case class WorkflowGraph(name: String,
                         version: String,
                         nodes: List[Node] = List.empty,
                         connections: List[Connection] = List.empty)
