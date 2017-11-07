package com.directv.hw.hadoop.template.service

import java.io._
import com.directv.hw.common.io.DapIoUtils._
import org.apache.commons.io.FileUtils

class TenantManagerImpl(repositoryPath: String) extends TenantManager {

  private lazy val tenantsDir = ensureDirExists(new File(repositoryPath))

  // create default tenant
  ensureDirExists(new File(repositoryPath + separator + "1"))

  override val tmpDir: File = ensureDirExists(new File(tenantsDir, "unpack"))

  override def createTenant(tenantId: Int): Unit = {
    val dir = tenantDir(tenantId)
    FileUtils.deleteDirectory(dir)
    val created = dir.mkdirs()
    if (!created) throw new IllegalAccessException("can not create dir in tenant repository")
  }

  override def deleteTemplate(tenantId: Int, templateId: Int): Unit = {
    val dir = templateDir(tenantId, templateId)
    FileUtils.forceDelete(dir)
  }

  override def deleteTenant(tenantId: Int): Unit = {
    val dir = tenantDir(tenantId)
    FileUtils.forceDelete(dir)
  }

  private def tenantDir(id: Int) = {
    new File(tenantsDir, id.toString)
  }

  def templateDir(tenantId: Int, templateId: Int): File = {
    new File(tenantDir(tenantId), templateId.toString)
  }

}
