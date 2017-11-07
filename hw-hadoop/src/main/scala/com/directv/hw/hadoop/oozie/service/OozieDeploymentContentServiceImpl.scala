package com.directv.hw.hadoop.oozie.service

import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.model._
import com.directv.hw.hadoop.template.injest.oozie.service.OozieComponentService
import scaldi.Injector

class OozieDeploymentContentServiceImpl(modulePath: ModulePath, user: String)(implicit injector: Injector)
  extends OozieContentService(user) with OozieDeploymentContentService {

  private lazy val ooziePlatformRepo = inject[OozieDeploymentService]
  private lazy val oozieTenantRepo = inject[OozieComponentService]
  private lazy val persistenceImpl = new SimpleWorkflowPersistenceImpl(inject[OozieDeploymentPersistenceService], modulePath, user)

  override protected lazy val fileService: ComponentFS = ooziePlatformRepo.getFileService(modulePath, modulePath.moduleId, user)
  override protected lazy val persistence: Option[SimpleWorkflowPersistenceImpl] = Some(persistenceImpl)
  override protected lazy val conversionOptions: ConversionOptions = ConversionOptions(isStrict = false)

  override def copyTo(path: ModulePath, files: List[String]): Unit = {
    super.copyTo(path, files)
    val to = ooziePlatformRepo.getFileService(modulePath, modulePath.moduleId, user)
    copyFIles(fileService, to, files)
  }

  override def copyTo(templateId: Int, files: List[String]): Unit = {
    super.copyTo(templateId, files)
    val to = oozieTenantRepo.getFileService(templateId)
    copyFIles(fileService, to, files)
  }
}
