package com.directv.hw.web.tenant.plugin

import com.directv.hw.common.web.CommonJsonFormats
import com.directv.hw.hadoop.template.model.{TemplatesImportResult, Tenant}
import com.directv.hw.web.tenant.model._

trait TenantJsonFormats extends CommonJsonFormats {
  implicit val tenantFormat = jsonFormat4(Tenant)
  implicit val tenantsFormat = jsonFormat1(Tenants)
  implicit val templatesFormat = jsonFormat1(Templates)
  implicit val flatTemplateFormat = jsonFormat2(FlatTemplate)
  implicit val flatTemplatesFormat = jsonFormat1(FlatTemplates)
  implicit val createdTenantFormat = jsonFormat1(CreatedTenant)
  implicit val templatesImportResultFormat = jsonFormat2(TemplatesImportResult)
  implicit val s3ImportRequestFormat = jsonFormat5(S3ImportRequest)
  implicit val s3ExportRequestFormat = jsonFormat1(S3ExportRequest)
}
