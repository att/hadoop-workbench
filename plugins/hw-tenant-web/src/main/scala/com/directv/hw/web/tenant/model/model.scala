package com.directv.hw.web.tenant.model

import com.directv.hw.hadoop.template.model.{Template, Tenant}

case class Templates(templates: List[Template])

case class FlatTemplate(template: Template, tenant: Tenant)
case class FlatTemplates(templates: List[FlatTemplate])

case class Tenants(tenants: List[Tenant])

case class CreatedTenant(id: Int)

case class S3ImportRequest(s3bucket: String, s3key: String, platformId: Int, clusterId: String, env: String)
case class S3ExportRequest(componentId: Int)