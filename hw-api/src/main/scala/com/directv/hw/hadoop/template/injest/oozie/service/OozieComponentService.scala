package com.directv.hw.hadoop.template.injest.oozie.service

import com.directv.hw.hadoop.model.ComponentTypes
import com.directv.hw.hadoop.template.injest.oozie.model.OozieTemplate
import com.directv.hw.hadoop.template.injest.oozie.service.OozieComponentService._
import com.directv.hw.hadoop.template.service.TenantRepo

object OozieComponentService {

  val typeAliases = List("oozie-workflow")

  val workflowVersionProp = "version"
  val workflowNameProp = "name"

  val workflowXmlFile = "workflow.xml"
}

trait OozieComponentService extends TenantRepo[OozieTemplate] {
  override lazy val getType: String = ComponentTypes.oozie
  override lazy val getTypeAliases: List[String] = typeAliases

  def findTemplates(version: String): List[OozieTemplate]
}
