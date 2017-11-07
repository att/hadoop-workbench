package com.directv.hw.hadoop.template.injest.flume.model

import com.directv.hw.hadoop.template.model.{Template, ComponentInfo}

case class AgentElementTemplate(elementType: String, elementSubtype: String,
                                agentName: String, nodeName: String,
                                info: ComponentInfo) extends Template