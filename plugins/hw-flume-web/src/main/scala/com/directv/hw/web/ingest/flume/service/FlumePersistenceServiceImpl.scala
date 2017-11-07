package com.directv.hw.web.ingest.flume.service

import com.directv.hw.core.service.PropertyService
import com.directv.hw.hadoop.model.ModulePath
import com.directv.hw.web.ingest.flume.model.{NodeData, UserData}
import scaldi.Injectable

object FlumePersistenceServiceImpl {
  val positioningKey = "positioning"

  import spray.json.DefaultJsonProtocol._
  import spray.json._
  implicit val nodeDataJson = jsonFormat2(NodeData)
  implicit val ModuleDataJson = jsonFormat2(UserData)

  def dataToString(userData: UserData) = userData.toJson.compactPrint
  def toUserData(serialized: String) = Option(serialized).map(_.parseJson.convertTo[UserData])
}

class FlumePersistenceServiceImpl(persistenceService: PropertyService, pluginId: String) extends FlumePersistenceService
  with Injectable {

  import FlumePersistenceServiceImpl._

  def getPositioning(modulePath: ModulePath, user: String): Option[UserData] = {
    toUserData(persistenceService.getValue(modulePath, positioningKey, pluginId, user))
  }

  def savePositioning(modulePath: ModulePath, userName: String, moduleData: UserData) = {
    persistenceService.saveValue(modulePath, positioningKey, pluginId, userName, dataToString(moduleData))
  }

  def deletePositioning(modulePath: ModulePath, user: String) = {
    persistenceService.delete(modulePath, positioningKey, pluginId, user)
  }

  def deletePositioning(modulePath: ModulePath) = {
    persistenceService.deleteAll(modulePath)
  }
}
