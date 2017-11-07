package com.directv.hw.hadoop.template.service

import java.nio.file.Path

import com.directv.hw.hadoop.config.MustacheProperty
import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.template.model.{ComponentDescriptor, ComponentInfo, Template, UpdateTemplateInfo}

trait TenantRepo[T <: Template] {

  def getType: String

  def getTypeAliases: List[String] = List.empty

  def getAllTemplates: List[T]

  def findTemplates(tenantId: Int): List[T]

  def getTemplate(id: Int): T

  def createTemplate(template: T): T

  def copyTemplate(sourceTemplateId: Int, template: T): T

  def saveDescriptor(id: Int, descriptor: ComponentDescriptor): Unit

  def readDescriptor(id: Int): Option[ComponentDescriptor]

  def importTemplate(tenantId: Int, dir: Path, descriptor: ComponentDescriptor): T

  def updateDbIndex(template: T)

  def updateComponentInfo(id: Int, info: UpdateTemplateInfo): Unit

  def getFileService(templateId: Int): ComponentFS

  def mustacheProperties: List[MustacheProperty]
}
