package com.directv.hw.hadoop.flume.converter

import com.directv.hw.hadoop.flume.model.{FlumeNode, FlumePipeline, NodeConfig}

trait FlumeConverter {
  def toFlumePipeline(textConfig: String): FlumePipeline

  def toTextConfig(pipeline: FlumePipeline): String

  // TODO (vkolischuk) either remove this or return (agentName, FlumeNode) as a single object
  @Deprecated
  def toFlumeNode(config: String): FlumeNode

  def toNodeConfig(node: FlumeNode, agentName: String): NodeConfig
}