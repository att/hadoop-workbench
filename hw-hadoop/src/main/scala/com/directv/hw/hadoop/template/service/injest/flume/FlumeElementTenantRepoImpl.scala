package com.directv.hw.hadoop.template.service.injest.flume

import java.io.{File, FileInputStream}

import com.directv.hw.common.io.DapIoUtils
import com.directv.hw.core.exception.ServerError
import com.directv.hw.hadoop.flume.converter.FlumeConverter
import com.directv.hw.hadoop.flume.model.FlumeNode
import com.directv.hw.hadoop.flume.service.FlumeFiles
import com.directv.hw.hadoop.template.injest.flume.model.AgentElementTemplate
import com.directv.hw.hadoop.template.injest.flume.service.FlumeElementTenantRepo
import com.directv.hw.hadoop.template.model.ComponentInfo
import com.directv.hw.hadoop.template.service.TenantRepoBase
import com.directv.hw.persistence.dao.FlumeElementTemplateDao
import com.directv.hw.persistence.entity.FlumeElementTemplateEntity
import org.apache.commons.io.IOUtils
import scaldi.{Injectable, Injector}

import scala.language.reflectiveCalls

class FlumeElementTenantRepoImpl(implicit injector: Injector)
    extends TenantRepoBase[AgentElementTemplate, FlumeElementTemplateEntity]
    with FlumeElementTenantRepo with Injectable {

  import FlumeElementTenantRepo._

  private val converter = inject[FlumeConverter]

  override protected val dao = inject[FlumeElementTemplateDao]

  override def getType = templateType

  override protected def makeTemplate(info: ComponentInfo, it: FlumeElementTemplateEntity): AgentElementTemplate = {
    AgentElementTemplate(it.elementType, it.elementSubtype, it.agentName, it.nodeName, info)
  }

  override protected def makeTemplate(info: ComponentInfo, properties: Map[String, String], dir: Option[File]): AgentElementTemplate = {
    val elementType = properties.getOrElse(elementTypeProp, throw new ServerError(s"Could not resolve flume element type"))

    val file = new File(dir.get, FlumeFiles.flumeConf)

    import scala.collection.JavaConverters._
    val content = DapIoUtils.managed2 (new FileInputStream(file)) (IOUtils.readLines). asScala mkString "\n"
    val pipeline = converter.toFlumePipeline(content)
    val node = (pipeline.sources ++ pipeline.sinks ++ pipeline.channels).head
    val elementSubType = properties.getOrElse(elementSubtypeProp, node.nodeType)
    val agentName = pipeline.agentName
    AgentElementTemplate(elementType, elementSubType, agentName, agentName, info)
  }

  override protected def toEntity(t: AgentElementTemplate): FlumeElementTemplateEntity = {
    FlumeElementTemplateEntity(Some(t.info.id), t.elementType, t.elementSubtype, t.agentName, t.nodeName)
  }

  override def extractProperties(t: AgentElementTemplate): Map[String, String] = {
    Map(
      elementTypeProp -> t.elementType,
      elementSubtypeProp -> t.elementSubtype,
      agentNameProp -> t.agentName,
      nodeNameProp -> t.nodeName
    )
  }

  override def findByElementType(elementType: String): List[AgentElementTemplate] = {
    val elements = dao.findByElementType(elementType)
    elements.map { tuple =>
      val (i, element) = tuple
      val info = ComponentInfo(i.id.get, i.tenantId, i.`type`, i.name, i.version, i.description, i.team)
      AgentElementTemplate(element.elementType, element.elementSubtype, element.agentName, element.nodeName, info)
    }
  }

  override def getNode(templateId: Int): FlumeNode = {
    val textConfig = getFileService(templateId).getFileContent(FlumeFiles.flumeConf)
    val agent = converter.toFlumePipeline(textConfig)
    (agent.sources ++ agent.channels ++ agent.sinks).head
  }

  override def updateNode(templateId: Int, node: FlumeNode, agentName: String): Unit = {
    val nodeConfig = converter.toNodeConfig(node, agentName)
    getFileService(templateId).saveFileContent(FlumeFiles.flumeConf, nodeConfig.config)
  }
}
