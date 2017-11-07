package com.directv.hw.hadoop.oozie.service

import com.directv.hw.hadoop.model.ModulePath
import com.directv.hw.hadoop.oozie.file.OozieComponentLocalFS
import com.directv.hw.hadoop.template.injest.oozie.service.OozieComponentService
import scaldi.Injector


class OozieComponentContentServiceImpl(templateId: Int, user: String)(implicit injector: Injector)
  extends OozieContentService(user) with OozieComponentContentService {

  private lazy val tenantRepo = inject[OozieComponentService]
  private lazy val platformRepo = inject[OozieDeploymentService]
  private lazy val persistenceService = inject[OozieComponentPersistenceService]

  override protected lazy val fileService =  OozieComponentLocalFS(tenantRepo.getFileService(templateId))
  override protected lazy val persistence = Some(new SimpleWorkflowTemplatePersistenceImpl(persistenceService, templateId, user))
  override protected lazy val conversionOptions = ConversionOptions(isStrict = false)

  override def copyTo(path: ModulePath, files: List[String]): Unit = {
    super.copyTo(path, files)
    val to = platformRepo.getFileService(path, path.moduleId, user)
    copyFIles(fileService, to, files)
  }

  override def copyTo(templateId: Int, files: List[String]): Unit = {
    super.copyTo(templateId, files)
    val to = tenantRepo.getFileService(templateId)
    copyFIles(fileService, to, files)
  }
}