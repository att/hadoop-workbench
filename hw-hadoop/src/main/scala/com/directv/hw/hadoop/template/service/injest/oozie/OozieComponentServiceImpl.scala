package com.directv.hw.hadoop.template.service.injest.oozie

import java.io.File

import com.directv.hw.core.exception.CalleeException
import com.directv.hw.hadoop.config.MustacheProperty
import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.oozie.model._
import com.directv.hw.hadoop.oozie.service.{OozieDeploymentService, WorkflowParser}
import com.directv.hw.hadoop.model.ModuleFileCommon
import com.directv.hw.hadoop.oozie.config.OozieMustacheProperties
import com.directv.hw.hadoop.template.injest.oozie.model.OozieTemplate
import com.directv.hw.hadoop.template.injest.oozie.service.OozieComponentService
import com.directv.hw.hadoop.template.model.{ComponentDescriptor, ComponentInfo}
import com.directv.hw.hadoop.template.service.TenantRepoBase
import com.directv.hw.persistence.dao.OozieTemplateDao
import com.directv.hw.persistence.entity.OozieTemplateEntity
import scaldi.{Injectable, Injector}

class OozieComponentServiceImpl(implicit injector: Injector)
  extends TenantRepoBase[OozieTemplate, OozieTemplateEntity]()
    with OozieComponentService with Injectable {

  import OozieComponentService._

  private val workflowParser = inject[WorkflowParser]
  private val ooziePlatformRepo = inject[OozieDeploymentService]

  override protected val dao: OozieTemplateDao = inject[OozieTemplateDao]

  override def findTemplates(version: String): List[OozieTemplate] = {
    dao.findByVersion(version).map(makeTemplate)
  }

  override protected def makeTemplate(info: ComponentInfo, e: OozieTemplateEntity): OozieTemplate = {
    OozieTemplate(e.schemaName, e.renderedSchemaName, e.schemaVersion, info)
  }

  override protected def toEntity(t: OozieTemplate): OozieTemplateEntity = {
    OozieTemplateEntity(Some(t.info.id), t.workflowName, t.renderedWorkflowName, t.workflowVersion)
  }

  override def makeTemplate(info: ComponentInfo, properties: Map[String, String], dir: Option[File]): OozieTemplate = {
    val extractedProperties = dir.flatMap(retrieveOozieTemplate) map { workflowInfo =>
      properties ++ Map(
        workflowNameProp -> workflowInfo.name,
        workflowVersionProp -> workflowInfo.version
      )
    } getOrElse properties

    def get(key: String) = extractedProperties.getOrElse(key, throw new CalleeException(s"Missing property [$key]"))

    val name = get(workflowNameProp)
    val version = get(workflowVersionProp)
    OozieTemplate(name, name, version, info)
  }

  override def extractProperties(t: OozieTemplate): Map[String, String] = {
    Map(
      workflowNameProp -> t.workflowName,
      workflowVersionProp -> t.workflowVersion
    )
  }

  private def retrieveOozieTemplate(dir: File): Option[WorkflowInfo] = {
    workflowParser.getWorkflowInfoFromFile(new File(dir, workflowXmlFile).getAbsolutePath)
  }

  override def mustacheProperties: List[MustacheProperty] = {
    val clusterProperties = super.mustacheProperties
    OozieMustacheProperties.values ++ clusterProperties
  }
}
