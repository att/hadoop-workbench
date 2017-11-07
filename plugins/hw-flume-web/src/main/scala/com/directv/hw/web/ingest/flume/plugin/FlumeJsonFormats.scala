package com.directv.hw.web.ingest.flume.plugin

import com.directv.hw.common.web.{CommonJsonFormats, FilesRouteFormats}
import com.directv.hw.core.exception.ServerError
import com.directv.hw.hadoop.config.MustacheProperty
import com.directv.hw.hadoop.host.model.PlatformHost
import com.directv.hw.hadoop.flume.model._
import com.directv.hw.hadoop.model.ParsedContent
import com.directv.hw.web.ingest.flume.model._
import spray.json._

trait FlumeJsonFormats extends CommonJsonFormats with FilesRouteFormats {

  implicit val positionFormat = jsonFormat2(Position)
  implicit val nodeFormat = jsonFormat5(Node)
  implicit val connectionFormat = jsonFormat2(Connection)
  implicit val visualPropertiesFormat = jsonFormat1(VisualProperties)
  implicit val flumeGraphFormat = jsonFormat4(FlumeGraph)
  implicit val agentInfoFormat = jsonFormat4(FlumeComponentInfo)
  implicit val agentInfoListFormat = jsonFormat1(AgentInfoList)
  implicit val webFlumeAgentFormat = jsonFormat7(WebFlumeAgent)
  implicit val deploymentErrorFormat = jsonFormat1(DeploymentError)
  implicit val deploymentResultFormat = jsonFormat2(DeploymentResult)
  implicit val updateAgentRequestFormat = jsonFormat3(UpdateAgentRequest)
  implicit val platformHostFormat = jsonFormat3(PlatformHost)
  implicit val webAgentInstanceFormat = jsonFormat6(WebAgentInstance)
  implicit val agentInstancesFormat = jsonFormat2(AgentInstances)
  implicit val createInstanceRequestFormat = jsonFormat1(CreateInstanceRequest)
  implicit val createdInstanceResponseFormat = jsonFormat1(CreatedInstanceResponse)
  implicit val updateInstanceRequestFormat = jsonFormat2(UpdateInstanceRequest)
  implicit val agentTemplatesListFormat = jsonFormat1(FlumeTemplates)
  implicit val newAgentTemplateRequestFormat = jsonFormat6(NewAgentTemplateRequest)
  implicit val createdTemplateFormat = jsonFormat1(CreatedTemplate)
  implicit val updateAgentTemplateRequestFormat = jsonFormat4(UpdateAgentTemplateRequest)
  implicit val webFlumeElementFormat = jsonFormat4(WebFlumeElement)
  implicit val newAgentElementTemplateRequestFormat = jsonFormat9(NewAgentElementTemplateRequest)
  implicit val deploymentInfoFormat = jsonFormat6(DeploymentInfo)
  implicit val mustachePropertyFormat = jsonFormat2(MustacheProperty)
  implicit val mustachePropertiesFormat = jsonFormat1(MustacheProperties)
  implicit val flumeElementTemplatesFormat = jsonFormat1(FlumeElementTemplates)


  override val marshalFileContent: PartialFunction[ParsedContent, JsValue] = {
    case o: FlumeGraph => flumeGraphFormat.write(o)
    case other => throw new ServerError(s"not supported: $other")
  }

  override val fileContentParsers: List[JsValue => ParsedContent] = List (_.convertTo[FlumeGraph])
}
