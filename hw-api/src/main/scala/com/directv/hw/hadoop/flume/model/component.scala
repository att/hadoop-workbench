package com.directv.hw.hadoop.flume.model

sealed abstract class FlumeNode {
  def name: String
  def nodeType: String
  def properties: Map[String, String]
}

case class FlumeSource(name: String, nodeType: String, properties: Map[String, String])
  extends FlumeNode

case class FlumeSink(name: String, nodeType: String, properties: Map[String, String])
  extends FlumeNode

case class FlumeChannel(name: String, nodeType: String, properties: Map[String, String])
  extends FlumeNode

case class FlumeConnection(from: String, to: String)

case class FlumePipeline(agentName: String,
                         sources: List[FlumeSource],
                         sinks: List[FlumeSink],
                         channels: List[FlumeChannel],
                         connections: List[FlumeConnection])

case class FlumeComponent(platformId: Int,
                          clusterId: String,
                          serviceId: String,
                          componentId: String,
                          name: String,
                          activeAgents: String)

case class FlumeComponentInfo(id: String, name: String, agentName: String, isBase: Boolean)

case class FlumeComponentConfig(name: String, agentName: String, pluginDir: String, isBase: Boolean = false)

case class FlumeComponentUpdate(name: Option[String] = None, agentName: Option[String] = None, pluginDir: Option[String] = None)

case class FlumePipelineConfig(pipeline: Option[FlumePipeline] = None, textConfig: Option[String] = None)

case class NodeConfig(name: String, agentName: String, config: String)