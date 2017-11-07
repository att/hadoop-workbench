package com.directv.hw.web.ingest.flume.service

import com.directv.hw.hadoop.model._
import com.directv.hw.web.ingest.flume.model.UserData

trait FlumePersistenceService {
  def getPositioning(modulePath: ModulePath, userName: String): Option[UserData]
  def savePositioning(modulePath: ModulePath, userName: String, userData: UserData)
  def deletePositioning(modulePath: ModulePath, userName: String)
  def deletePositioning(modulePath: ModulePath)
}

