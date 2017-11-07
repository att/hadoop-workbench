package com.directv.hw.web.ingest.flume.service

import com.directv.hw.core.service.PropertyService
import com.directv.hw.web.ingest.flume.model.UserData
import scaldi.Injectable

trait FlumeTemplatePersistenceService {
  def getPositioning(templateId: Int, userName: String): Option[UserData]
  def savePositioning(templateId: Int, userName: String, moduleData: UserData)
  def deletePositioning(templateId: Int, userName: String)
  def deletePositioning(templateId: Int)
}

class FlumeTemplatePersistenceServiceImpl(persistenceService: PropertyService) extends FlumeTemplatePersistenceService with Injectable {
  import FlumePersistenceServiceImpl._

  def getPositioning(templateId: Int, user: String): Option[UserData] = {
    toUserData(persistenceService.getValue(templateId, positioningKey, user))
  }

  def savePositioning(templateId: Int, userName: String, moduleData: UserData) = {
    persistenceService.saveValue(templateId, positioningKey, userName, dataToString(moduleData))
  }

  def deletePositioning(templateId: Int, user: String) = {
    persistenceService.delete(templateId, positioningKey, user)
  }

  override def deletePositioning(templateId: Int) = throw new UnsupportedOperationException
}
