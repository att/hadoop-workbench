package com.directv.hw.hadoop.flume.service

import java.io._
import java.nio.charset.StandardCharsets

import com.directv.hw.common.io.DapIoUtils
import com.directv.hw.common.io.DapIoUtils._
import com.directv.hw.core.exception.{DapException, ServerError}
import com.directv.hw.hadoop.access.AccessManagerService
import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.flume.file.FlumeComponentLocalFS
import com.directv.hw.hadoop.host.model.{PlatformHost, PlatformHostAccess}
import com.directv.hw.hadoop.flume.model._
import com.directv.hw.hadoop.model.{ModuleFileCommon, ModulePath}
import com.directv.hw.hadoop.ssh.exception.RemoteAccessException
import com.directv.hw.hadoop.ssh.routing.RemoteAccessServiceRouter
import com.directv.hw.hadoop.ssh.service.RemoteAccessService
import com.directv.hw.persistence.dao.FlumeComponentDao
import com.directv.hw.persistence.entity.FlumeComponentEntity
import com.typesafe.scalalogging.LazyLogging
import org.apache.commons.io.{FileUtils, IOUtils}
import scaldi.{Injectable, Injector}
import spray.httpx.SprayJsonSupport
import spray.json.DefaultJsonProtocol

import scala.language.postfixOps
import scala.util.Success

class FlumeLocalRepoImpl(repositoryPath: File, keysDir: String)(implicit injector: Injector) extends FlumeLocalRepo
  with Injectable with LazyLogging {

  private val baseFileDir = ensureDirExists(repositoryPath)

  private val remoteAccessRouter = inject[RemoteAccessServiceRouter]
  private val hostManager = inject[AccessManagerService]
  private val flumeComponentDao = inject[FlumeComponentDao]

  override def getFileService(path: ModulePath): ComponentFS = {
    FlumeComponentLocalFS(path, filesDir(path), onUpdate)
  }

  override def deleteAgentFiles(agentPath: ModulePath) = {
    val dir = filesDir(agentPath)
    if(dir.exists()) {
      FileUtils.deleteDirectory(dir)
    }
  }

  override def getSyncStatus(agentPath: ModulePath, targets: List[SyncTarget]): SyncState = {
    SyncDescriptorUtils.readDescriptor(filesDir(agentPath))
  }

  override def addSyncTarget(agentPath: ModulePath, target: SyncTarget): PersistedSyncInstance = {
    val status = readAgentSync(agentPath)
    val others = status.instances filter (_.id != target.id)
    val result = pushPlugins(agentPath, target)
    val instance = PersistedSyncInstance(target.id, result)
    val updatedStatus = status.copy(instances = others :+ instance)
    saveAgentSync(agentPath, updatedStatus)
    instance
  }

  override def deleteSyncTarget(agentPath: ModulePath, target: SyncTarget) = {
    forgetSyncTarget(agentPath, target)
    deletePluginDir(agentPath, target)
  }

  override def forgetSyncTarget(agentPath: ModulePath, target: SyncTarget) = {
    val status = readAgentSync(agentPath)
    val others = status.instances filter (_.id != target.id)
    val updatedStatus = status.copy(instances = others)
    saveAgentSync(agentPath, updatedStatus)
  }

  override def refreshSync(agentPath: ModulePath, targets: List[SyncTarget]): SyncState = {
    val verified = verifySync(agentPath, targets)
    val state = SyncState(verified map toPersistedInstance)
    saveAgentSync(agentPath, state)
    state
  }

  override def pullPlugins(agentPath: ModulePath, targets: List[SyncTarget]): SyncState = {
    val instances = withTargets(targets) { target =>
      pullPlugins(agentPath, target)
    }
    val existingResults = readAgentSync(agentPath).instances map {i => i.id -> i.result} toMap
    val updatedInstances = instances map { instance =>
      val result = existingResults.get(instance.target.id) -> instance.result match {
        case (_, e: SyncError) => e
        case (Some(SyncOk), SyncOk) => SyncOk
        case _ => SyncRequired
      }
      SyncInstance(instance.target, result)
    }
    val state = SyncState(updatedInstances map toPersistedInstance)
    saveAgentSync(agentPath, state)
    state
  }

  override def pushPlugins(agentPath: ModulePath, targets: List[SyncTarget]): SyncState = {
    val instances = withTargets(targets) { target =>
      pushPlugins(agentPath, target)
    }

    val (ok, failed) = instances partition (_.result == SyncOk)

    val verified = verifySync(agentPath, ok map (_.target))

    val state = SyncState((verified ++ failed) map toPersistedInstance)
    saveAgentSync(agentPath, state)
    state
  }

  override def deletePlugins(agentPath: ModulePath, targets: List[SyncTarget]): SyncState = {
    val instances = withTargets(targets) { target =>
      deletePluginDir(agentPath, target, silent = false)
    }

    val instancesToSave = instances map { instance =>
      instance.result match {
        case SyncOk => instance.copy(result = SyncRequired)
        case _ => instance
      }
    }

    val state = SyncState(instancesToSave map toPersistedInstance)
    saveAgentSync(agentPath, state)
    state
  }


  override def onUpdate(path: ModulePath) = {
    updateDescriptor(path)(markAllUpdated)
  }

  override def onInstanceUpdate(agentPath: ModulePath, instanceId: String) = {
    updateDescriptor(agentPath) { sync =>
      val (relevant, others) = sync.instances.partition(_.id == instanceId)
      val updated = relevant map { _.copy(result = SyncRequired) }
      sync.copy(instances = updated ++ others)
    }
  }

  override def getAllComponents: List[FlumeComponent] = {
    flumeComponentDao.getComponents.map(toServiceModel)
  }

  override def saveComponent(comp: FlumeComponent) = {
    flumeComponentDao.optimisticSave(toEntity(comp))
  }

  override def deleteComponent(modulePath: ModulePath) = {
    flumeComponentDao.deleteComponent(modulePath)
  }

  private def toServiceModel(entity: FlumeComponentEntity) = {
    FlumeComponent (
      entity.platformId,
      entity.clusterId,
      entity.serviceId,
      entity.componentId,
      entity.componentName,
      entity.agentName
    )
  }

  private def toEntity(comp: FlumeComponent) = {
    FlumeComponentEntity (
      comp.platformId,
      comp.clusterId,
      comp.serviceId,
      comp.componentId,
      comp.name,
      comp.activeAgents
    )
  }

  private case class RemotePlugin(name: String, path: String, size: Long)

  private def verifySync(agentPath: ModulePath, targets: List[SyncTarget]): List[SyncInstance] = {
    val fileService = getFileService(agentPath)
    val existingFiles = getPluginFiles(fileService) map { file =>
      toPluginName(file.path) -> file
    } toMap

    withTargets(targets) { target =>
      syncOperation(agentPath, target) { (remoteService, dir, canWrite) =>
        val remoteFiles = listRemoteFiles(remoteService, dir) map (p => p.name -> p) toMap

        existingFiles.size == remoteFiles.size && existingFiles.forall(f => remoteFiles.contains(f._1))
      } fold (isSynchronized => if(isSynchronized) SyncOk else SyncRequired, r => r)
    }
  }

  private def pullPlugins(agentPath: ModulePath, target: SyncTarget) = {
    logger.debug(s"Pulling plugins for agent instance [$agentPath] from [${target.host}]")

    val fileService = getFileService(agentPath)
    val existingFiles = getPluginFiles(fileService) map { file =>
      toPluginName(file.path) -> file
    } toMap

    syncResult(agentPath, target) { (remoteService, dir, canWrite) =>
      listRemoteFiles(remoteService, dir) withFilter (p => !existingFiles.contains(p.name)) foreach { remotePlugin =>
        remoteService.retrieveFile(remotePlugin.path)(fileService.writeFile(toPluginFile(remotePlugin.name), _))
      }
    }
  }

  private def pushPlugins(agentPath: ModulePath, target: SyncTarget) = {
    logger.debug(s"Deploying plugins for agent instance [$agentPath] to [${target.host}]")

    val fileService = getFileService(agentPath)
    val files = getPluginFiles(fileService)
    logger.debug(s"found [${files.size}] repository files for agent [$agentPath]")

    syncResult(agentPath, target) { (remoteService, dir, canWrite) =>
      if (!canWrite) {
        throw new ServerError(s"Access to directory $dir not configured")
      }
      remoteService.wipeDir(dir)
      val subDir = target.subDir
      val remoteLibPath = s"$dir/$subDir/$remoteLibDir"

      remoteService.mkDirs(remoteLibPath)

      files foreach { file =>
        remoteService.transferFile(fileService.getLocalFile(file.path), concat(remoteLibPath, toPluginName(file.path)))
      }
    }
  }

  private def deletePluginDir(agentPath: ModulePath, target: SyncTarget, silent: Boolean = true) = {
    logger.debug(s"Deleting plugins for agent instance [$agentPath] on [${target.host}]")

    syncResult(agentPath, target) { (remoteService, dir, canWrite) =>
      if (canWrite) {
        remoteService.wipeDir(dir)
      } else {
        if (!silent) {
          throw new DapException(s"Deleting from directory $dir not allowed")
        }
      }
    }
  }

  private def listRemoteFiles(remoteService: RemoteAccessService, dir: String): List[RemotePlugin] = {
    remoteService.listFiles(dir) withFilter (_.isDir) flatMap { subDir =>
      val subPath = concat(dir, subDir.name)
      remoteService.listFiles(subPath) withFilter (_.name == remoteLibDir) flatMap { libDir =>
        val libPath = concat(subPath, remoteLibDir)
        remoteService.listFiles(libPath) withFilter (!_.isDir) map { rf =>
          RemotePlugin(rf.name, concat(libPath, rf.name), rf.size)
        }
      }
    }
  }


  private def withTargets(targets: List[SyncTarget])(operation: SyncTarget => SyncResult): List[SyncInstance] = {
    targets map { target =>
      val result = operation(target)
      SyncInstance(target, result)
    }
  }

  private def syncResult(agentPath: ModulePath, target: SyncTarget)(operation: (RemoteAccessService, String, Boolean) => Unit): SyncResult = {
    syncOperation(agentPath, target)(operation) match {
      case Left(_) => SyncOk
      case Right(r) => r
    }
  }

  private def syncOperation[T](agentPath: ModulePath, target: SyncTarget)(operation: (RemoteAccessService, String, Boolean) => T): Either[T, SyncResult] = {
    def toSyncResult(message: String, e: Throwable) = {
      logger.error(s"Flume plugin synchronization error. Agent: [$agentPath], target: [$target]", e)
      Success(Right(SyncError(s"Plugin synchronization error: [$message]")))
    }

    val hostname = hostnameForHost(target.host)
    target.dir match {
      case d if d startsWith "/" =>
        val access = hostManager.findPlatformAccess(agentPath.platformId) getOrElse (throw new DapException(s"No SSH access configured for platform hosts"))
        managed2(remoteService(access, hostname))({ remoteService =>
          Left(operation(remoteService, target.dir, canWrite(target.dir, access.pluginDirs)))
        }, {
          case e: RemoteAccessException => toSyncResult(s"Remote access error: ${e.getMessage}", e)
          case e: DapException => toSyncResult(s"${e.getMessage}", e)
          case e =>
            toSyncResult("Unknown", e)
        })
      case _ => Right(SyncError("Plugin dir should be a valid absolute path"))
    }
  }

  private def remoteService(access: PlatformHostAccess, hostname: String) = {
    def getValue(option: Option[String], name: String) = {
      option getOrElse (throw new DapException(s"Platform access not configured proprly: $name is empty"))
    }

    val remoteService = if (access.keyFileId.isDefined) {
      val path = hostManager.getKeyFileById(access.keyFileId.get)._2
      remoteAccessRouter.getKeyBasedService(hostname, access.port, getValue(access.userName, "user name"), path.toString)
    } else {
      remoteAccessRouter.getPassBasedService(hostname, access.port, getValue(access.userName, "user name"), getValue(access.password, "password"))
    }
    remoteService
  }

  private def canWrite(dir: String, pluginDirs: List[String]): Boolean = {
    if (dir.contains("/[.]+/")) {
      throw new ServerError(s"Illegal plugin dir")
    }
    if (dir.contains("/[.]+$")) {
      throw new ServerError(s"Illegal plugin dir")
    }
    val depth = 4
    if (dir.count(_ == '/') < depth) {
      throw new ServerError(s"Plugin dir should haveat least $depth depth")
    }

    true
  }

  private def getPluginFiles(fileService: ComponentFS) = {
    fileService.listFiles(FlumeComponentLocalFS.pluginPath, ComponentFS.excludeDirectories, depth = 1)
  }

  private def toPluginName(file: String) = file.substring(FlumeComponentLocalFS.pluginPath.length)

  private def toPluginFile(name: String) = ModuleFileCommon.concat(FlumeComponentLocalFS.pluginPath, name)


  private val remoteLibDir = "lib"


  private def hostnameForHost(host: PlatformHost) = host.hostname getOrElse host.ip


  private def markAllUpdated(sync: SyncState) = {
    val updatedStatuses = sync.instances map (s => s.copy(result = SyncRequired))
    sync.copy(instances = updatedStatuses)
  }

  private def readAgentSync(agentPath: ModulePath) = SyncDescriptorUtils.readDescriptor(filesDir(agentPath))

  private def saveAgentSync(agentPath: ModulePath, state: SyncState): Unit = {
    SyncDescriptorUtils.writeDescriptor(filesDir(agentPath), state)
  }

  private def toPersistedInstance(instance: SyncInstance) = {
    PersistedSyncInstance(instance.target.id, instance.result)
  }

  private def updateDescriptor(agentPath: ModulePath)(update: SyncState => SyncState) = {
    val state = readAgentSync(agentPath)
    val updated = update(state)
    saveAgentSync(agentPath, updated)
  }


  private def filesDir(agentPath: ModulePath): File = {
    new File(new File(new File(new File(baseFileDir, agentPath.platformId.toString), agentPath.clusterId), agentPath.serviceId), agentPath.moduleId)
  }

}

object SyncDescriptorUtils extends DefaultJsonProtocol with SprayJsonSupport {
  import DapIoUtils._
  import spray.json._

  import scala.collection.JavaConverters._

  val charset = StandardCharsets.UTF_8

  implicit object syncResultFormat extends RootJsonFormat[SyncResult] {
    val ok = "OK"
    val required = "SYNC_REQUIRED"
    val error = "SYNC_ERROR"

    override def write(obj: SyncResult): JsValue = {
      val string = obj match {
        case SyncOk => ok
        case SyncRequired => required
        case e: SyncError => error
      }
      JsString(string)
    }

    override def read(json: JsValue): SyncResult = {
      json.asInstanceOf[JsString].value match {
        case `ok` => SyncOk
        case `required` => SyncRequired
        case `error` => SyncError("")
      }
    }
  }
  implicit val syncInstanceFormat = jsonFormat2(PersistedSyncInstance)
  implicit val syncStateFormat = jsonFormat1(SyncState)

  def readDescriptor(baseDir: File): SyncState = {
    val file = new File(baseDir, FlumeFiles.instanceDeploymentDescriptor)
    if(file.exists) {
      managed2(new FileInputStream(file)) { is =>
        val json = IOUtils.readLines(is, charset).asScala.mkString("\n")
        json.parseJson.convertTo[SyncState]
      }
    } else {
      SyncState(List.empty)
    }
  }

  def writeDescriptor(baseDir: File, descriptor: SyncState) = {
    val file = new File(baseDir, FlumeFiles.instanceDeploymentDescriptor)
    ensureDirExists(file.getParentFile)
    managed2(new FileOutputStream(file)) { os =>
      val json = descriptor.toJson.prettyPrint
      IOUtils.write(json, os, charset)
    }
  }
}