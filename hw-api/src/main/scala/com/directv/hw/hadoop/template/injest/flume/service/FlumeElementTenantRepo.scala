package com.directv.hw.hadoop.template.injest.flume.service

import com.directv.hw.hadoop.flume.model.FlumeNode
import com.directv.hw.hadoop.template.injest.flume.model.AgentElementTemplate
import com.directv.hw.hadoop.template.service.TenantRepo

object FlumeElementTenantRepo {
  val templateType = "flumeElement"
  val displayType = "Flume Element"

  val elementTypeProp = "elementType"
  val elementSubtypeProp = "elementSubtype"
  val agentNameProp = "agentName"
  val nodeNameProp = "nodeName"
}

trait FlumeElementTenantRepo extends TenantRepo[AgentElementTemplate] {
  def findByElementType(elementType: String): List[AgentElementTemplate]

  def getNode(templateId: Int): FlumeNode
  def updateNode(templateId: Int, node: FlumeNode, agentName: String)
}
