package com.directv.hw.hadoop.template.model

case class ComponentInfo(id: Int,
                         tenantId: Int,
                         `type`: String,
                         name: String,
                         version: String,
                         description: Option[String],
                         team: Option[String] = None)

case class UpdateTemplateInfo(name: String, version: String, description: Option[String], team: Option[String])

abstract class Template {
  def info: ComponentInfo
}

case class Tenant(id: Option[Int], name: String, version: String, description: Option[String])

case class TemplatesImportResult(templates: List[Template] = List.empty, errors: List[String] = List.empty)