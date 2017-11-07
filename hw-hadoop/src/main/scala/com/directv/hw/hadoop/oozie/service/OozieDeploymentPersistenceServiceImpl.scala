package com.directv.hw.hadoop.oozie.service

import com.directv.hw.core.service.PropertyService
import com.directv.hw.hadoop.model.ModulePath
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}

class OozieDeploymentPersistenceServiceImpl(implicit injector: Injector) extends OozieDeploymentPersistenceService with Injectable with LazyLogging {
  private val propertyService = inject[PropertyService]
  private val pluginId = "oozie"

  def saveCoords(modulePath: ModulePath, file: String, userName: String, coords: String): Unit = {
    propertyService.saveValue(modulePath, makeKey(file), pluginId, userName, coords)
  }

  def getCoords(modulePath: ModulePath, file: String, userName: String): String = {
    propertyService.getValue(modulePath, makeKey(file), pluginId, userName)
  }

  def deleteCoords(modulePath: ModulePath, file: String, userName: String): Unit = {
    propertyService.delete(modulePath, makeKey(file), pluginId, userName)
  }

  def deleteCoords(modulePath: ModulePath): Unit = {
    propertyService.deleteAll(modulePath)
  }

  private def makeKey(file: String) = {
    file + "|" + "coordinates"
  }
}
