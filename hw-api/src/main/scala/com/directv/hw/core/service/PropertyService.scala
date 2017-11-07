package com.directv.hw.core.service

import com.directv.hw.hadoop.model.ModulePath

case class TemplatePropertyEntry(TemplateId: Int, key: String, user: String, value: String)

trait PropertyService {
  def getValue(modulePath: ModulePath, key: String, pluginId: String, user: String): String
  def saveValue(modulePath: ModulePath, key: String, pluginId: String, user: String, value: String)
  def delete(modulePath: ModulePath, key: String, pluginId: String, user: String)
  def deleteAll(modulePath: ModulePath)
  def deleteAllForPlatform(platformId: Int)

  def getAllValues(templateId: Int): List[TemplatePropertyEntry]
  def getValue(templateId: Int, key: String, user: String): String
  def saveValue(templateId: Int, key: String, user: String, value: String)
  def delete(templateId: Int, key: String, user: String)
  def deleteAll(templateId: Int)
}
