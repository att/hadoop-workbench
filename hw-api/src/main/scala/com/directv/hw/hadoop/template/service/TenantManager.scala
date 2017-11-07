package com.directv.hw.hadoop.template.service

import java.io.File

import com.directv.hw.hadoop.files.ComponentFS

trait TenantManager {
  def tmpDir: File

  def createTenant(tenantId: Int)

  def deleteTemplate(tenantId: Int, templateId: Int)

  def deleteTenant(tenantId: Int)
}
