package com.directv.hw.web.ingest.flume.service

import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.flume.service.FlumeLocalRepo
import com.directv.hw.hadoop.model.ModulePath
import com.directv.hw.web.ingest.flume.model.UserData
import scaldi.Injector

object FlumePlatformContentService {
  def apply(modulePath: ModulePath, user: String)(implicit injector: Injector) =
    new FlumePlatformContentService(modulePath, user)
}

class FlumePlatformContentService(modulePath: ModulePath, user: String)
                                 (implicit injector: Injector) extends FlumeContentService {

  private lazy val relativeModulePath = modulePath.relativeModulePath
  private lazy val pluginService = inject[FlumeLocalRepo]
  private lazy val persistenceService = inject[FlumePersistenceService]
  private lazy val flumeService = flumeRouter.getFlumeService(modulePath.platformId)

  override protected lazy val fileService: ComponentFS =
    new FlumeComponentFS(flumeService, relativeModulePath, pluginService.getFileService(modulePath))

  override protected lazy val simplePersistence = new SimpleFlumePersistence {
    override def getPositioning = persistenceService.getPositioning(modulePath, user)
    override def savePositioning(userData: UserData) = persistenceService.savePositioning(modulePath, user, userData)
    override def deletePositioning() = persistenceService.deletePositioning(modulePath, user)
  }
}
