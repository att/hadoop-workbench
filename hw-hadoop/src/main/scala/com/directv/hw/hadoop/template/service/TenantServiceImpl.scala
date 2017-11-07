package com.directv.hw.hadoop.template.service

import java.io._
import java.nio.file.{Files, Path}

import com.directv.hw.common.io.DapIoUtils._
import com.directv.hw.common.io.PackUtils
import com.directv.hw.common.io.PackUtils._
import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.core.exception._
import com.directv.hw.core.service.{AppConf, PropertyService}
import com.directv.hw.hadoop.aws.AwsClientRouter
import com.directv.hw.hadoop.files.{ComponentFS, LocalFsFactory}
import com.directv.hw.hadoop.model.MetaFile
import com.directv.hw.hadoop.template.model._
import com.directv.hw.persistence.dao.{TemplateInfoDao, TenantDao}
import com.directv.hw.persistence.entity.TenantEntity
import com.typesafe.scalalogging.LazyLogging
import org.apache.commons.io.FileUtils
import scaldi.{Injectable, Injector}

import scala.collection.JavaConversions._
import scala.concurrent.{ExecutionContext, Future}
import scala.language.postfixOps
import scala.concurrent.ExecutionContext.Implicits.global

class TenantServiceImpl(templateServices: List[TenantRepo[_ <: Template]])(implicit injector: Injector)
extends TenantService with Injectable with LazyLogging {

  private val tenantDao = inject[TenantDao]
  private val templateDao = inject[TemplateInfoDao]
  private val tenantRepoService = inject[TenantManager]
  private val appConf = inject[AppConf]
  private val localFsFactory = inject[LocalFsFactory]
  private implicit val dispatcher: ExecutionContext = inject[DispatcherFactory].auxiliaryDispatcher

  private val templateServicesByType = {
    val primary: Map[String, TenantRepo[_ <: Template]] = templateServices.map(s => s.getType -> s).toMap
    val aliases: Map[String, TenantRepo[_ <: Template]] = templateServices.flatMap(s => s.getTypeAliases map (alias => alias -> s)).toMap
    primary ++ aliases
  }
  private val propertyService = inject[PropertyService]
  private val awsClientRouter = inject[AwsClientRouter]
  private val unpackDir = tenantRepoService.tmpDir.toPath

  private lazy val defaultTenantId: Int = tenantDao.findTenant(TenantService.defaultTenantName, TenantService.defaultTenantVersion).get.id.get

  override def getTenants: List[Tenant] = {
    tenantDao.getTenants.map(toTenant)
  }

  override def getTenant(id: Int): Tenant = {
    tenantDao.findTenant(id) map toTenant getOrElse (throw new ServerError(s"Unknown tenant ID: $id"))
  }

  override def createTenant(tenant: Tenant, user: String): Int = {
    if(tenant.name.isEmpty) throw new IllegalArgumentException(s"Empty tenant name")
    if(tenant.id.nonEmpty) throw new IllegalArgumentException(s"Id should be empty")
    ensureValidTenant(tenant.name, tenant.version)
    ensureNotExists(tenant.name, tenant.version)
    val id = tenantDao createTenant toEntity(tenant)
    tenantRepoService createTenant id
    id
  }

  override def updateTenant(tenant: Tenant, user: String): Unit = {
    if(tenant.id.get == defaultTenantId) {
      throw new ServerError(s"Operation not allowed")
    }

    ensureValidTenant(tenant.name, tenant.version)
    tenantDao.updateTenant(toEntity(tenant))
  }

  // TODO (vkolischuk) possible race condition if a new template is created while tenant is being deleted. Use actors?
  override def deleteTenant(id: Int, force: Boolean = false, user: String): Unit = {
    if(id == defaultTenantId) {
      throw new ServerError(s"Operation not allowed")
    }
    val templates = getTemplates(id)
    if(templates.nonEmpty) {
      if (force) {
        templates foreach { template =>
          deleteTemplate(template.info.id, user)
        }
      } else {
        throw new DapException(s"Cannot delete non-empty tenant", errorType = Some(ErrorTypeNonEmpty))
      }
    }
    tenantDao deleteTenant id
    tenantRepoService deleteTenant id
  }

  override def getAllTemplates: List[Template] = {
      templateServices flatMap { service =>
        service.getAllTemplates
      }
  }

  override def getTemplates(tenantId: Int): List[Template] = {
    templateServices flatMap { service =>
      service findTemplates tenantId
    }
  }

  override def importArchivedBundle(maybeTenantId: Option[Int],
                                    is: InputStream,
                                    overwrite: Boolean, user: String): List[Template] = {

    val tenantId = maybeTenantId getOrElse defaultTenantId
    val result = importAsStream(is, overwrite, tenantId, user)
    result
  }

  private def importAsStream(is: InputStream, overwrite: Boolean, tenantId: Int, user: String) = {
    val tmpUnpackDir = generateTmpDir
    try {
      logger.debug(s"unpacking initial tar.bz2")
      unpackTarBzip2(is, tmpUnpackDir)
      recursiveComponentImport(tmpUnpackDir, tenantId, overwrite, user)
    } finally {
      FileUtils.deleteDirectory(tmpUnpackDir.toFile)
    }
  }

  override def importFromS3(s3bucket: String,
                            s3key: String,
                            overwrite: Boolean,
                            tenantIdOpt: Option[Int], user: String): List[Template] = {

    val tenantId = tenantIdOpt.getOrElse(defaultTenantId)
    val is = awsClientRouter.getAwsClient.getObjectAsStream(s3bucket, s3key)
    val result = importAsStream(is, overwrite, tenantId, user)
    result
  }

  override def exportToS3(componentId: Int): Future[Unit] = {
    val component = templateDao.getById(componentId)
    val tenantId = component.tenantId
    val dir = s"${appConf.tenantsDir}/$tenantId/$componentId"
    val fileService: ComponentFS = localFsFactory.getLocalFs(dir)

    val client = awsClientRouter.getAwsClient
    val s3Key = s"${component.name}_${component.version}.tar.bz2"
    if (client.getObjects(appConf.awsS3Bucket).contains(s3Key)) {
      throw new DeploymentException(s"Application bundle [$s3Key] has already submitted")
    }

    val os = new PipedOutputStream
    val is = new PipedInputStream(os, appConf.s3UploadBufferSize)

    val pack = Future {
      logger.debug("Archiving component before export to S3")
      val startArchiving = System.currentTimeMillis()
      PackUtils.packTarBz2(os, fileService.listFiles(), (file: String) => fileService.readFile(file))
      logger.debug(s"Archiving succeed. Archiving took ${System.currentTimeMillis - startArchiving} ms")
    }

    val upload = Future {
      logger.debug("Upload archive to S3 bucket")
      val startS3Upload = System.currentTimeMillis()
      client.uploadObject(appConf.awsS3Bucket, s3Key, is)
      logger.debug(s"Upload to S3 has been finished ${System.currentTimeMillis() - startS3Upload} ms")
    }

    pack.onComplete(_ => os.close())
    upload.onComplete(_ => is.close())
    pack.zip(upload).map(_ => Unit)
  }

  override def deleteTemplate(id: Int, user: String): Unit = {
    val info = templateDao.getById(id)
    FileUtils.deleteDirectory(new File(s"${appConf.tenantsDir}/${info.tenantId}/${info.id.get}"))
    propertyService.deleteAll(id)
    templateDao.delete(id)
  }

  override def getTenantRepo(`type`: String): TenantRepo[_ <: Template] = {
    templateServicesByType.getOrElse(`type`, throw new ServerError(s"Unsupported template type: ${`type`}"))
  }

  private def recursiveComponentImport(path: Path, tenantId: Int, overwrite: Boolean, user: String): List[Template] = {

    if (Files.exists(path.resolve(MetaFile.compDescPath))) {
      List(importComponent(tenantId, path, overwrite, user))
    } else {
      managed2(Files.newDirectoryStream(path)) { dirStream =>
        dirStream.filter(file => Files.isRegularFile(file) && file.toString.endsWith("tar.bz2")).foreach { arc =>
          logger.debug(s"unpacking nested archive $arc")
          unpackTarBzip2(Files.newInputStream(arc), path)
          Files.delete(arc)
        }
      }

      managed2(Files.newDirectoryStream(path)) { dirStream =>
        dirStream.filter(Files.isDirectory(_)).foldLeft(List.empty[Template]) { (total, dir) =>
          recursiveComponentImport(dir, tenantId, overwrite, user) ::: total
        }
      }
    }
  }

  private def generateTmpDir: Path = {
    unpackDir.resolve(System.currentTimeMillis().toString + ".unpacked")
  }

  private def importComponent(tenantId: Int, rootDir: Path, overwrite: Boolean, user: String): Template = {
    logger.debug(s"detected component with valid descriptor [$rootDir]. Importing ...")

    lazy val dir = rootDir.getFileName.toString

    val descriptor = TemplateUtils.readTemplateDescriptor(rootDir).getOrElse {
      throw new NotSupportedException(s"Descriptor not found in $dir")
    }

    val existing = getTemplates(tenantId).filter { template =>
      descriptor.artifactId.contains(template.info.name) && descriptor.version.contains(template.info.version)
    }

    existing foreach { template =>
      if (overwrite) {
        deleteTemplate(template.info.id, user)
      } else {
        throw new DapException(s"Template with name [${template.info.name}] and version [${template.info.version}] already exists", errorType = Some(ErrorTypeAlreadyExists))
      }
    }

    val `type` = descriptor.`type`
    val tenantRepo = getTenantRepo(`type`)
    tenantRepo.importTemplate(tenantId, rootDir, descriptor)
  }

  private def toTenant(e: TenantEntity): Tenant = {
    Tenant(e.id, e.name, e.version, e.description)
  }

  private def toEntity(t: Tenant): TenantEntity = {
    TenantEntity(t.id, t.name, t.version, t.description)
  }

  private def ensureValidTenant(name: String, version: String): Unit = {
    if(name.isEmpty) {
      throw new ServerError("Empty tenant name")
    }
    if(version.isEmpty) {
      throw new ServerError("Empty tenant version")
    }
  }

  private def ensureNotExists(name: String, version: String): Unit = {
    if(tenantDao.findTenant(name, version).nonEmpty) {
      throw new ServerError(s"Tenant name and version should be unique")
    }
  }
}
