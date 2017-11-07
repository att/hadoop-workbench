package com.directv.hw.hadoop.template.service.injest.flume

import java.io.{File, FileInputStream}

import com.directv.hw.common.io.DapIoUtils
import com.directv.hw.hadoop.flume.converter.FlumeConverter
import com.directv.hw.hadoop.template.injest.flume.model.AgentTemplate
import com.directv.hw.hadoop.template.injest.flume.service.FlumeTenantRepo
import com.directv.hw.hadoop.template.model.ComponentInfo
import com.directv.hw.hadoop.template.service.TenantRepoBase
import com.directv.hw.persistence.dao.FlumeTemplateDao
import com.directv.hw.persistence.entity.FlumeTemplateEntity
import org.apache.commons.io.IOUtils
import scaldi.{Injectable, Injector}

class FlumeTenantRepoImpl(implicit injector: Injector)
    extends TenantRepoBase[AgentTemplate, FlumeTemplateEntity]
    with FlumeTenantRepo with Injectable {

  import FlumeTenantRepo._

  private val converter = inject[FlumeConverter]

  override protected val dao = inject[FlumeTemplateDao]

  override protected def makeTemplate(info: ComponentInfo, e: FlumeTemplateEntity): AgentTemplate = {
    AgentTemplate(info)
  }

  override protected def toEntity(t: AgentTemplate) = {
    FlumeTemplateEntity(Some(t.info.id), "")
  }

  override def makeTemplate(info: ComponentInfo, properties: Map[String, String], dir: Option[File]): AgentTemplate = {
    AgentTemplate(info)
  }

  private def extractAgentName(dir: File): String = {
    import scala.collection.JavaConverters._

    val file = new File(dir, flumeConfFile)
    val text = DapIoUtils.managed2(new FileInputStream(file))(IOUtils.readLines).asScala.mkString("\n")
    converter.toFlumePipeline(text).agentName
  }

  override def extractProperties(t: AgentTemplate): Map[String, String] = {
    Map.empty
  }
}

