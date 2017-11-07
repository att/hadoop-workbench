package com.directv.hw.hadoop.template.service.injest.oozie

import java.io.File

import com.directv.hw.core.exception.CalleeException
import com.directv.hw.hadoop.config.MustacheProperty
import com.directv.hw.hadoop.oozie.config.OozieMustacheProperties
import com.directv.hw.hadoop.template.injest.oozie.model.OozieNodeTemplate
import com.directv.hw.hadoop.template.injest.oozie.service.OozieNodeTenantRepo
import com.directv.hw.hadoop.template.model.ComponentInfo
import com.directv.hw.hadoop.template.service.TenantRepoBase
import com.directv.hw.persistence.dao.OozieNodeTemplateDao
import com.directv.hw.persistence.entity.OozieNodeTemplateEntity
import scaldi.{Injectable, Injector}

class OozieNodeTenantRepoImpl(implicit injector: Injector)
  extends TenantRepoBase[OozieNodeTemplate, OozieNodeTemplateEntity]()
  with OozieNodeTenantRepo with Injectable {

  import OozieNodeTenantRepo._

  override def getType = templateType

  override protected val dao = inject[OozieNodeTemplateDao]

  override def findTemplates(nodeType: String, version: String): List[OozieNodeTemplate] = {
    dao.findByNodeTypeAndVersion(nodeType, version).map(makeTemplate)
  }

  override protected def makeTemplate(info: ComponentInfo, e: OozieNodeTemplateEntity): OozieNodeTemplate = {
    OozieNodeTemplate(e.nodeType, e.version, info)
  }

  override protected def toEntity(t: OozieNodeTemplate) = {
    OozieNodeTemplateEntity(Some(t.info.id), t.actionSubtype, t.version)
  }

  override def makeTemplate(info: ComponentInfo, properties: Map[String, String], dir: Option[File]): OozieNodeTemplate = {
    def get(key: String) = properties.getOrElse(key, throw new CalleeException(s"Missing property [$key]"))

    OozieNodeTemplate(get(nodeTypeProp), get(versionProp), info)
  }

  override def extractProperties(t: OozieNodeTemplate): Map[String, String] = {
    Map(
      nodeTypeProp -> t.actionSubtype,
      versionProp -> t.version
    )
  }

  override def mustacheProperties: List[MustacheProperty] = {
    super.mustacheProperties ++ OozieMustacheProperties.values
  }
}
