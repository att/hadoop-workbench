package com.directv.hw.hadoop.oozie.service

import com.directv.hw.core.service.PropertyService
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}


class OozieComponentPersistenceServiceImpl(implicit injector: Injector) extends OozieComponentPersistenceService with Injectable with LazyLogging {
  private val propertyService = inject[PropertyService]
  private val keySuffix = "__coordinates"

  override def findCoords(templateId: Int): List[WorkflowTemplatePersistenceEntry] = {
    propertyService.getAllValues(templateId) collect {
      case e if e.key endsWith keySuffix =>
        val file = e.key.substring(0, e.key.length - keySuffix.length)
        WorkflowTemplatePersistenceEntry(templateId, file, e.user, e.value)
    }
  }

  override def getCoords(templateId: Int, file: String, userName: String): String = {
    val nodesJson = propertyService.getValue(templateId, makeKey(file), userName)
    nodesJson
  }

  override def saveCoords(templateId: Int, file: String, userName: String, coords: String): Unit = {
    propertyService.saveValue(templateId, makeKey(file), userName, coords)
  }

  override def deleteCoords(templateId: Int, file: String, userName: String): Unit = {
    propertyService.delete(templateId, makeKey(file), userName)
  }

  private def makeKey(file: String) = {
    file + keySuffix
  }
}
