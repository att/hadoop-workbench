package com.directv.hw.common.web

import com.directv.hw.core.exception.ServerError
import com.directv.hw.hadoop.metrics.{MetricsAssignment, MetricsAssignmentList}
import com.directv.hw.hadoop.model.{ModuleFile, ModuleFiles, PathElement, WebModuleFile}
import com.directv.hw.hadoop.platform.model.PlatformInfo
import com.directv.hw.hadoop.template.injest.flume.model.{AgentElementTemplate, AgentTemplate}
import com.directv.hw.hadoop.template.injest.oozie.model.{OozieNodeTemplate, OozieTemplate}
import com.directv.hw.hadoop.template.model._
import com.directv.hw.util.ParameterEnumeration
import org.joda.time.DateTime
import spray.json._

trait CommonJsonFormats extends DefaultJsonProtocol {

  implicit val rootJsValueFormat = rootFormat(JsValueFormat)
  implicit val componentInfoFormat = jsonFormat7(ComponentInfo)
  implicit val webMessageFormat = jsonFormat1(WebMessage)
  implicit val emptyResponseFormat = jsonFormat1(EmptyResponse)
  implicit val platformInfoFormat = jsonFormat4(PlatformInfo)
  implicit val metricsAssignmentFormat = jsonFormat5(MetricsAssignment)
  implicit val metricsAssignmentListFormat = jsonFormat1(MetricsAssignmentList)
  implicit val pathElementFormat: RootJsonFormat[PathElement] = rootFormat(lazyFormat(jsonFormat(PathElement,
      "name", "path", "type", "size", "accessTime", "modificationTime", "owner", "group", "permissions", "children"
  )))

  implicit val moduleFileFormat = jsonFormat4(ModuleFile)
  implicit val moduleFilesFormat = jsonFormat1(ModuleFiles)
  implicit val webModuleFileFormat = jsonFormat3(WebModuleFile)
  implicit val oozieNodeTemplateFormat = jsonFormat3(OozieNodeTemplate)
  implicit val oozieWorkflowTemplateFormat = jsonFormat4(OozieTemplate)
  implicit val agentTemplateFormat = jsonFormat1(AgentTemplate)
  implicit val agentElementTemplateFormat = jsonFormat5(AgentElementTemplate)

  implicit object TemplateDataFormat extends RootJsonFormat[Template] {
    def write(x: Template) = x match {
      case o: OozieNodeTemplate => oozieNodeTemplateFormat.write(o)
      case o: OozieTemplate => oozieWorkflowTemplateFormat.write(o)
      case o: AgentTemplate => agentTemplateFormat.write(o)
      case o: AgentElementTemplate => agentElementTemplateFormat.write(o)
      case _ => throw new IllegalArgumentException("not supported")
    }

    def read(value: JsValue) = throw new IllegalArgumentException("not supported")
  }

  implicit val componentDescriptorFormat = jsonFormat7(ComponentDescriptor)

  implicit object DateTimeFormat extends RootJsonFormat[DateTime] {
    def write(dt: DateTime) = {
      JsNumber(dt.getMillis)
    }

    def read(value: JsValue): DateTime = value match {
      case number: JsNumber =>
        new DateTime(number.value.longValue())
      case other =>
        throw new ServerError(s"Invalid time: $other")
    }
  }

  def enumFormat[T <: ParameterEnumeration](enum: T) = new RootJsonFormat[enum.Value] {
    override def write(x: enum.Value) = JsString(x.toString)
    override def read(json: JsValue): enum.Value = enum.fromString(json.convertTo[String])
  }
}