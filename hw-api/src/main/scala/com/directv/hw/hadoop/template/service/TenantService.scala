package com.directv.hw.hadoop.template.service

import java.io.InputStream

import com.directv.hw.hadoop.template.model.{Template, Tenant}

import scala.concurrent.Future

object TenantService {
  val defaultTenantName = "Default"
  val defaultTenantVersion = "1.0"
}

trait TenantService {
  def getTenants: List[Tenant]
  def getTenant(id: Int): Tenant
  def createTenant(tenant: Tenant, user: String): Int
  def updateTenant(tenant: Tenant, user: String)
  def deleteTenant(id: Int, force: Boolean, user: String)

  def getAllTemplates: List[Template]
  def getTemplates(tenantId: Int): List[Template]
  def importArchivedBundle(tenantId: Option[Int],
                           is: InputStream,
                           overwrite: Boolean,
                           user: String): List[Template]

  def importFromS3(s3bucket: String,
                   s3key: String,
                   overwrite: Boolean = false,
                   tenantId: Option[Int] = None,
                   user: String): List[Template]

  def exportToS3(componentId: Int): Future[Unit]

  def deleteTemplate(id: Int, user: String)
  def getTenantRepo(`type`: String): TenantRepo[_ <: Template]
}
