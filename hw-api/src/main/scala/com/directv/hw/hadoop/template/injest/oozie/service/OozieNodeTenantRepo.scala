package com.directv.hw.hadoop.template.injest.oozie.service

import com.directv.hw.hadoop.template.injest.oozie.model.OozieNodeTemplate
import com.directv.hw.hadoop.template.service.TenantRepo


object OozieNodeTenantRepo {
  val templateType = "oozieNode"

  val nodeTypeProp = "nodeType"
  val versionProp = "version"
}

trait OozieNodeTenantRepo extends TenantRepo[OozieNodeTemplate]{
  def findTemplates(nodeType: String, version: String): List[OozieNodeTemplate]
}
