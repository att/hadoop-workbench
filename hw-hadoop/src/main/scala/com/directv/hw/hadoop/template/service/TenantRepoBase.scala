package com.directv.hw.hadoop.template.service

import java.io._
import java.nio.file._

import com.directv.hw.common.io.DapIoUtils
import com.directv.hw.core.service.{AppConf, ComponentLocalFS}
import com.directv.hw.hadoop.config.{DescriptorConverter, MustacheClusterProperties, MustacheProperty}
import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.oozie.service.OozieFiles
import com.directv.hw.hadoop.template.model._
import com.directv.hw.persistence.dao._
import com.directv.hw.persistence.entity.TemplateInfoEntity
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}

abstract class TenantRepoBase[T <: Template, E](implicit injector: Injector) extends TenantRepo[T]
  with Injectable with LazyLogging {

  protected val clusterPropertiesDao: CustomClusterDataDao = inject[CustomClusterDataDao]
  protected val descriptorConverter: DescriptorConverter = inject[DescriptorConverter]
  protected val appConf: AppConf = inject[AppConf]

  protected def dao: TemplateDao[E]

  protected def makeTemplate(info: ComponentInfo, it: E): T

  protected def makeTemplate(info: ComponentInfo, properties: Map[String, String], dir: Option[File] = None): T

  protected def toEntity(template: T): E

  protected def extractProperties(t: T): Map[String, String]

  protected def makeTemplate(tuple: (TemplateInfoEntity, E)): T = {
    makeTemplate(toTemplateInfo(tuple._1), tuple._2)
  }

  override def saveDescriptor(id: Int, descriptor: ComponentDescriptor): Unit = {
    val descriptorText = descriptorConverter.marshall(descriptor)
    createFileService(id).saveFileContent(OozieFiles.descriptor, descriptorText)
  }

  override def readDescriptor(id: Int): Option[ComponentDescriptor] = {
    createFileService(id).tryFileContent(OozieFiles.descriptor).map(descriptorConverter.parse)
  }

  override def getAllTemplates: List[T] = {
    dao.getAllTemplates.map(makeTemplate)
  }

  override def findTemplates(tenantId: Int): List[T] = {
    dao.findTemplates(tenantId).map(makeTemplate)
  }

  override def getTemplate(id: Int): T = {
    val descriptor = createFileService(id).tryFileContent(OozieFiles.descriptor).map(descriptorConverter.parse)
    if (descriptor.isEmpty) logger.warn(s"can not read standard descriptor for component id: $id")
    val artifactId = descriptor.flatMap(desc => desc.artifactId.orElse(desc.name)).getOrElse("???")
    val version = descriptor.flatMap(_.version).getOrElse("???")
    val description = descriptor.flatMap(_.description)
    val team = descriptor.flatMap(_.team)
    val (component, info) = dao.getTemplate(id)
    val updatedComponent = component.copy(name = artifactId, version = version, description = description, team = team)
    dao.updateTemplate(updatedComponent, info)
    makeTemplate((updatedComponent, info))
  }

  override def createTemplate(template: T): T = {
    val ensureTypeInfo: ComponentInfo = template.info.copy(`type` = getType)
    val id = dao.createTemplate(toInfoEntity(ensureTypeInfo), toEntity(template))
    val fixedInfo = ensureTypeInfo.copy(id = id)
    val created = makeTemplate(fixedInfo, toEntity(template))
    updateDbIndex(created)
    created
  }

  override def copyTemplate(sourceTemplateId: Int, template: T): T = {
    val created = createTemplate(template)

    val source = createFileService(sourceTemplateId)
    val target = createFileService(created.info.id)
    DapIoUtils.copyAll(source, target)

    created
  }

  override def importTemplate(tenantId: Int, fromDir: Path, descriptor: ComponentDescriptor): T = {
    val info = ComponentInfo (
      -1, tenantId,
      getType,
      descriptor.artifactId.orElse(descriptor.name).getOrElse("???"),
      descriptor.version getOrElse "???",
      descriptor.description,
      descriptor.team
    )

    val properties = descriptor.properties.getOrElse(Map.empty)
    val template = makeTemplate(info, properties, Some(fromDir.toFile))
    val result = createTemplate(template)
    importFromDir(result.info.tenantId, result.info.id, fromDir)
    result
  }

  override def updateComponentInfo(id: Int, info: UpdateTemplateInfo): Unit = {
    dao.updateInfo(id, info)
  }

  override def updateDbIndex(template: T): Unit = {
    dao.updateTemplate(toInfoEntity(template.info), toEntity(template))
  }

  override def getFileService(componentId: Int): ComponentFS = {
    createFileService(componentId)
  }

  private def createFileService(componentId: Int) = {
    val (component, _) = dao.getTemplate(componentId)
    new ComponentLocalFS(new File(s"${appConf.tenantsDir}/${component.tenantId}/${component.id.get}"))
  }

  private def importFromDir(tenantId: Int, templateId: Int, fromDir: Path) = {
    val templateDir = resolveTenantDir(tenantId).resolve(templateId.toString)
    Files.move(fromDir, templateDir, StandardCopyOption.REPLACE_EXISTING)
  }

  private def resolveTenantDir(tenantId: Int): Path = Paths.get(appConf.tenantsDir, tenantId.toString)

  private def toTemplateInfo(e: TemplateInfoEntity): ComponentInfo = {
    ComponentInfo (
      e.id.get,
      e.tenantId,
      e.`type`,
      e.name,
      e.version,
      e.description,
      e.team)
  }

  private def toInfoEntity(i: ComponentInfo): TemplateInfoEntity = {
    TemplateInfoEntity (
      Some(i.id),
      i.tenantId,
      i.`type`,
      i.name,
      i.version,
      i.description,
      i.team)
  }

  override def mustacheProperties: List[MustacheProperty] = {
    val customProps = clusterPropertiesDao.findAll().map(entity => MustacheProperty(entity.key, entity.description))
    MustacheClusterProperties.values ++ customProps
  }
}
