package com.directv.hw.core.service

import java.util.regex.Pattern

import com.directv.hw.core.service.PropertyServiceImpl._
import com.directv.hw.hadoop.model.ModulePath
import com.directv.hw.persistence.dao.PropertyDao
import com.directv.hw.persistence.entity.PropertyEntity

object PropertyServiceImpl {
  val separator = "|"
  val regexSeparator = Pattern quote separator

  val templatePrefix = "template"
}

class PropertyServiceImpl(propertyDao: PropertyDao) extends PropertyService {

  override def getValue(modulePath: ModulePath, key: String, pluginId: String, user: String): String = {
    val dbKey = makeDbKey(modulePath, key, pluginId, user)
    propertyDao.getValue(dbKey)
  }

  override def saveValue(modulePath: ModulePath, key: String, pluginId: String, user: String, value: String): Unit = {
    val dbKey = makeDbKey(modulePath, key, pluginId, user)
    propertyDao.saveValue(dbKey, value)
  }

  override def delete(modulePath: ModulePath, key: String, pluginId: String, user: String): Unit = {
    val dbKey = makeDbKey(modulePath, key, pluginId, user)
    propertyDao.delete(dbKey)
  }

  override def deleteAll(modulePath: ModulePath): Unit = {
    val dbKey = makeDbKey(modulePath)
    propertyDao.deleteByPartialKey(dbKey + separator)
  }

  override def deleteAllForPlatform(platformId: Int) = {
    val dbKey = platformId.toString
    propertyDao.deleteByPartialKey(dbKey + separator)
  }

  private def makeDbKey(modulePath: ModulePath, key: String, pluginId: String, user: String): String = {
    List (
      makeDbKey(modulePath),
      key,
      pluginId,
      user
    ) mkString separator
  }

  private def makeDbKey(modulePath: ModulePath): String = {
    List (
      modulePath.platformId,
      modulePath.clusterId,
      modulePath.serviceId,
      modulePath.moduleId
    ) mkString separator
  }

  override def getAllValues(templateId: Int): List[TemplatePropertyEntry] = {
    propertyDao.findByPartialKey(makeTemplateDbKey(templateId) + separator) map toTemplateEntry
  }

  override def getValue(templateId: Int, key: String, user: String): String = {
    val dbKey = makeTemplateDbKey(templateId, key, user)
    propertyDao.getValue(dbKey)
  }

  override def saveValue(templateId: Int, key: String, user: String, value: String) = {
    val dbKey = makeTemplateDbKey(templateId, key, user)
    propertyDao.saveValue(dbKey, value)
  }

  override def delete(templateId: Int, key: String, user: String) = {
    val dbKey = makeTemplateDbKey(templateId, key, user)
    propertyDao.delete(dbKey)
  }

  override def deleteAll(templateId: Int) = {
    val dbKey = makeTemplateDbKey(templateId) + separator
    propertyDao.deleteByPartialKey(dbKey)
  }

  private def makeTemplateDbKey(templateId: Int, key: String, user: String): String = {
    List(makeTemplateDbKey(templateId), key, user) mkString separator
  }

  private def makeTemplateDbKey(templateId: Int): String = {
    List(templatePrefix, templateId) mkString separator
  }

  private def toTemplateEntry(entity: PropertyEntity) = {
    val parts = entity.key.split(regexSeparator, 4)
    TemplatePropertyEntry(parts(1).toInt, parts(2), parts(3), entity.value)
  }

}
