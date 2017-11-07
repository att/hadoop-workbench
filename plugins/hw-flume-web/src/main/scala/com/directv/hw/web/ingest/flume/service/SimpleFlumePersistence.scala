package com.directv.hw.web.ingest.flume.service

import com.directv.hw.web.ingest.flume.model.UserData

trait SimpleFlumePersistence {
  def getPositioning: Option[UserData]
  def savePositioning(moduleData: UserData)
  def deletePositioning()
}

