package com.directv.hw.web.ingest.flume.service

import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.template.injest.flume.service.FlumeTenantRepo
import com.directv.hw.web.ingest.flume.model.UserData
import scaldi.Injector

object FlumeTemplateContentService {
  def apply(templateId: Int, user: String)(implicit injector: Injector) =
    new FlumeTemplateContentService(templateId, user)
}

class FlumeTemplateContentService(templateId: Int, user: String)(implicit injector: Injector) extends FlumeContentService {

  private lazy val templateService = inject[FlumeTenantRepo]
  private lazy val persistenceService = inject[FlumeTemplatePersistenceService]

  override protected lazy val fileService: ComponentFS = templateService.getFileService(templateId)
  override protected lazy val simplePersistence = new SimpleFlumePersistence {
    override def getPositioning = persistenceService.getPositioning(templateId, user)
    override def savePositioning(userData: UserData) = persistenceService.savePositioning(templateId, user, userData)
    override def deletePositioning() = persistenceService.deletePositioning(templateId, user)
  }
}
