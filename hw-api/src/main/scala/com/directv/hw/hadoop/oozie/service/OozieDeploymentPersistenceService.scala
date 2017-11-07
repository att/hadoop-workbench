package com.directv.hw.hadoop.oozie.service

import com.directv.hw.hadoop.model.ModulePath

trait OozieDeploymentPersistenceService {
  def saveCoords(modulePath: ModulePath, file: String, userName: String, coords: String)

  def getCoords(modulePath: ModulePath, file: String, userName: String): String

  def deleteCoords(modulePath: ModulePath, file: String, userName: String)

  def deleteCoords(modulePath: ModulePath)
}
