package com.directv.hw.web.ingest.flume.model

import com.directv.hw.hadoop.config.MustacheProperty
import com.directv.hw.hadoop.host.model.PlatformHost
import com.directv.hw.hadoop.flume.model.FlumeComponentInfo
import com.directv.hw.hadoop.model.{ModuleFile, ParsedContent}
import com.directv.hw.hadoop.platform.model.PlatformInfo
import com.directv.hw.hadoop.template.injest.flume.model.{AgentElementTemplate, AgentTemplate}
import com.directv.hw.hadoop.template.model.ComponentInfo

/////////////    Pipeline web model     ////////

case class Position(x: Int, y: Int)

case class Node(id: String, `type`: String, subtype: String, properties: Map[String, String], position: Position)

case class Connection(from: String, to: String)

case class VisualProperties(positionType: String)

case class FlumeGraph(agentName: String, nodes: List[Node], connections: List[Connection], visualProperties: Option[VisualProperties])
  extends ParsedContent


////////////    Agent       ///////////////

case class AgentInfoList(modules: List[FlumeComponentInfo])

case class WebFlumeAgent(name: String, agentName: String, pluginDir: String, files: List[ModuleFile], isBase: Option[Boolean],
                         platform: Option[PlatformInfo] = None,
                         component: Option[ComponentInfo] = None)

case class DeploymentError(message: String)
case class DeploymentResult(moduleId: String, errors: List[DeploymentError])

case class UpdateAgentRequest(name: Option[String], agentName: Option[String], pluginDir: Option[String])


////////////    Instance         ////////////////////

case class WebAgentInstance(id: String, host: PlatformHost, state: String, agentName: String, pluginDir: String, errors: List[String])

case class AgentInstances(instances: List[WebAgentInstance], availableHosts: List[PlatformHost])

case class CreateInstanceRequest(hostId: String)

case class CreatedInstanceResponse(instanceId: String)

case class UpdateInstanceRequest(agentName: Option[String], pluginDir: Option[String])


////////////    Agent Template      /////////////////////

case class FlumeTemplates(templates: List[AgentTemplate])

case class NewAgentTemplateRequest(templateId: Option[Int], tenantId: Int, agentName: String, name: Option[String], version: String, description: Option[String])

case class CreatedTemplate(templateId: Int)

case class UpdateAgentTemplateRequest(name: String, version: String, description: Option[String], team: Option[String])


////////////    Agent Element Template      /////////////////////

case class FlumeElementTemplates(elements: List[AgentElementTemplate])

case class WebFlumeElement(`type`: String, subtype: String, files: List[ModuleFile], properties: Map[String, String])

case class WebFlumeElementTemplate(properties: Map[String, String]) extends ParsedContent

case class NewAgentElementTemplateRequest(templateId: Option[Int], tenantId: Int,
                                          elementType: String, elementSubtype: String,
                                          nodeName: Option[String], agentName: Option[String],
                                          name: String, version: String, description: Option[String])

case class MustacheProperties(properties: List[MustacheProperty])
