package com.directv.hw.hadoop.flume.service

import java.io.{File, FileInputStream, InputStream}

import ch.qos.logback.classic.{Logger, LoggerContext}
import com.directv.hw.common.io.DapIoUtils._
import com.directv.hw.hadoop.access.AccessManagerService
import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.host.model.{PlatformHost, PlatformHostAccess}
import com.directv.hw.hadoop.flume.model._
import com.directv.hw.hadoop.model.{ModuleFileCommon, ModulePath}
import com.directv.hw.hadoop.ssh.model.RemoteFile
import com.directv.hw.hadoop.ssh.routing.RemoteAccessServiceRouter
import com.directv.hw.hadoop.ssh.service.RemoteAccessService
import com.directv.hw.persistence.dao.FlumeComponentDao
import com.typesafe.scalalogging.LazyLogging
import org.apache.commons.io.{FileUtils, FilenameUtils}
import org.scalamock.scalatest.MockFactory
import org.scalatest.{BeforeAndAfter, FlatSpec, Matchers}
import org.slf4j.LoggerFactory
import scaldi.{Injectable, Module}

class FlumePluginServiceSpec extends FlatSpec with Matchers with BeforeAndAfter with MockFactory with Injectable with LazyLogging {
  private val testDir = new File(FilenameUtils.concat(System.getProperty("java.io.tmpdir"), s"repository.${System.currentTimeMillis}"))
  private val repositoryDir = new File(testDir, "repository")
  private val remoteDir = new File(testDir, "remote")
  private val rootPluginDir = "/path"

  private val loggerContext = LoggerFactory.getILoggerFactory.asInstanceOf[LoggerContext]
  private val pluginServiceLogger: Logger = loggerContext.getLogger(classOf[FlumeLocalRepoImpl])
  private var loggerLevel: ch.qos.logback.classic.Level = _


  before {
    loggerLevel = pluginServiceLogger.getLevel
    pluginServiceLogger.setLevel(ch.qos.logback.classic.Level.OFF)
    cleanFiles()
  }

  after {
    pluginServiceLogger.setLevel(loggerLevel)
    cleanFiles()
  }

  "FlumePluginService" should "sync" in {
    val service = createPluginService()

    val agentPath = new ModulePath(1, "cluster1", "flume", "agent1")
    val target1 = createSyncTarget("1")
    val target2 = createSyncTarget("2")
    val target3 = createSyncTarget("3")
    val targets = List(target1, target2, target3)

    List(service.getSyncStatus(agentPath, targets)) foreach { state =>
      val instances = state.instances
      instances should have size 0
    }

    List(service.refreshSync(agentPath, targets)) foreach { state =>
      val instances = state.instances
      instances should have size targets.size
      instances foreach { instance =>
        instance.result should matchPattern { case SyncOk => }
      }
    }

    val seed1 = 1
    val seed2 = 2
    writeRemoteLib(target1, seed1)
    writeRemoteLib(target2, seed2)

    List(service.getSyncStatus(agentPath, targets)) foreach { state =>
      val instances = state.instances
      instances should have size targets.size
      instances foreach { instance =>
        instance.result should matchPattern { case SyncOk => }
      }
    }

    List(service.refreshSync(agentPath, targets)) foreach { state =>
      val instances = state.instances
      instances should have size targets.size
      instances foreach { instance =>
        instance.id match {
          case id if id == target1.id => instance.result should matchPattern { case SyncRequired => }
          case id if id == target2.id => instance.result should matchPattern { case SyncRequired => }
          case _ => instance.result should matchPattern { case SyncOk => }
        }
      }
    }

    List(service.pullPlugins(agentPath, targets)) foreach { state =>
      val instances = state.instances
      instances should have size targets.size
      instances foreach { instance =>
        instance.result should matchPattern { case SyncRequired => }
      }
    }

    List(service.pushPlugins(agentPath, targets)) foreach { state =>
      val instances = state.instances
      instances foreach { instance =>
        instance.result should matchPattern { case SyncOk => }
      }
      targets foreach { target => verifyRemotePlugins(target, List(seed1, seed2)) }
    }

    libPath(target3, seed1).delete
    List(service.refreshSync(agentPath, targets)) foreach { state =>
      val instances = state.instances
      instances should have size targets.size
      instances foreach { instance =>
        instance.id match {
          case id if id == target3.id => instance.result should matchPattern { case SyncRequired => }
          case _ => instance.result should matchPattern { case SyncOk => }
        }
      }
    }

    List(service.pushPlugins(agentPath, targets)) foreach { state =>
      val instances = state.instances
      instances foreach { instance =>
        instance.result should matchPattern { case SyncOk => }
      }
      targets foreach { target => verifyRemotePlugins(target, List(seed1, seed2)) }
    }
  }

  "FlumePluginService" should "auto deploy and clean" in {
    val service = createPluginService()

    val agentPath = new ModulePath(1, "cluster1", "flume", "agent1")
    val target1 = createSyncTarget("1")
    val target2 = createSyncTarget("2")
    val targets = List(target1, target2)

    val seed1 = 1
    val seed2 = 2
    writeRemoteLib(target1, seed1)
    writeRemoteLib(target2, seed2)

    service.pullPlugins(agentPath, targets)
    service.pushPlugins(agentPath, targets)

    val target3 = createSyncTarget("3")
    val targets2 = targets :+ target3

    verifyDir(pseudoRemoteFile(hostname(target3), target3.dir), Set.empty)

    service.addSyncTarget(agentPath, target3)

    targets2 foreach { target => verifyRemotePlugins(target, List(seed1, seed2))}

    service.deleteSyncTarget(agentPath, target1)

    verifyDir(pseudoRemoteFile(hostname(target1), target1.dir), Set.empty)

    val targets3 = targets2 filterNot (_ == target1)

    targets3 foreach { target => verifyRemotePlugins(target, List(seed1, seed2))}
  }

  "FlumePluginService" should "update sync state on file change" in {
    val seed1 = 1
    val seed2 = 2
    val agentPath = new ModulePath(1, "cluster1", "flume", "agent1")

    def ensureResult(action: FlumeLocalRepo => Any, verifyResult: SyncResult => Any) = {
      cleanFiles()

      val service = createPluginService()
      val target1 = createSyncTarget("1")
      val target2 = createSyncTarget("2")
      val target3 = createSyncTarget("3")
      val targets = List(target1, target2, target3)
      targets foreach (service.deleteSyncTarget(agentPath, _))
      service.deleteAgentFiles(agentPath)
      val fileService = service.getFileService(agentPath)
      List(seed1, seed2) foreach { seed =>
        fileService.saveFileContent("lib/" + libName(seed), libContent(seed))
      }

      List(service.pushPlugins(agentPath, targets)) foreach { state =>
        val instances = state.instances
        instances foreach { instance =>
          instance.result should matchPattern { case SyncOk => }
        }

        targets foreach { target => verifyRemotePlugins(target, List(seed1, seed2)) }
      }

      action(service)

      List(service.getSyncStatus(agentPath, targets)) foreach { state =>
        val instances = state.instances
        instances foreach { instance =>
          verifyResult(instance.result)
        }
      }

      cleanFiles()
    }

    ensureResult(
      { service => service.onUpdate(agentPath) },
      { result => result should matchPattern { case SyncRequired => } }
    )

    ensureResult(
      { service => service.getFileService(agentPath).saveFileContent("a/b.txt" , "abc") },
      { result => result should matchPattern {case SyncOk => } }
    )

    ensureResult(
      { service => service.getFileService(agentPath).saveFileContent("lib/c/d.jar" , "123") },
      { result => result should matchPattern {case SyncRequired => } }
    )

    val seed3 = 3
    ensureResult(
      { service => service.getFileService(agentPath).saveFileContent("lib/" + libName(seed3), libContent(seed3)) },
      { result => result should matchPattern {case SyncRequired => } }
    )

    ensureResult(
      { service =>
        val fileService = service.getFileService(agentPath)
        val file = "a/b.txt"
        fileService.saveFileContent(file , "abc")
        fileService.move(file, "lib/1.txt")
      },
      { result => result should matchPattern {case SyncRequired => } }
    )

    ensureResult(
      { service => service.getFileService(agentPath).move("lib/" + libName(seed1), "other/lib.jar") },
      { result => result should matchPattern {case SyncRequired => } }
    )

    ensureResult(
      { service => service.getFileService(agentPath).delete("lib/" + libName(seed1)) },
      { result => result should matchPattern {case SyncRequired => } }
    )

  }

  "FlumePluginService" should "report errors" in {

    def ensureError(stub: RemoteAccessService => Any, operation: (FlumeLocalRepo, ModulePath, List[SyncTarget]) => SyncState) = {
      cleanFiles()

      val targetForError = createSyncTarget("1")
      val target2 = createSyncTarget("2")
      val target3 = createSyncTarget("3")
      val targets = List(targetForError, target2, target3)

      val agentPath = new ModulePath(1, "cluster1", "flume", "agent1")

      val remoteAccessRouter = mock[RemoteAccessServiceRouter]

      (remoteAccessRouter.getPassBasedService _).stubs(*,*,*,*) onCall { (host: String, port: Int, user: String, password: String) =>
        val remoteService = mock[RemoteAccessService]
        if(host == hostname(targetForError)) {
          stub(remoteService)
        }
        stubRemoteService(remoteService, host)
      }

      val service = createPluginService(remoteAccessRouter)

      val seed1 = 1
      val seed2 = 2

      writeRemoteLib(targetForError, seed1)
      writeRemoteLib(target2, seed2)

      val seed3 = 3

      service.getFileService(agentPath).saveFileContent("lib/" + libName(seed3), libContent(seed3))

      val instances = operation(service, agentPath, targets).instances
      instances should have size targets.size
      instances foreach { instance =>
        instance.id match {
          case id if id == targetForError.id => instance.result should matchPattern { case SyncError(_) => }
          case _ => instance.result should matchPattern { case SyncOk | SyncRequired => }
        }
      }
    }

    ensureError (
      { remoteService => (remoteService.listFiles _).expects(*).anyNumberOfTimes().throws(new Exception()) },
      { (service, agentPath, targets) => service.refreshSync(agentPath, targets) }
    )
    ensureError (
      { remoteService => (remoteService.listFiles _).expects(*).anyNumberOfTimes().throws(new Exception()) },
      { (service, agentPath, targets) => service.pullPlugins(agentPath, targets) }
    )
    ensureError (
      { remoteService => (remoteService.listFiles _).expects(*).anyNumberOfTimes().throws(new Exception()) },
      { (service, agentPath, targets) => service.pushPlugins(agentPath, targets) }
    )

    ensureError (
      { remoteService => (remoteService.mkDirs _).expects(*).anyNumberOfTimes().throws(new Exception()) },
      { (service, agentPath, targets) => service.pushPlugins(agentPath, targets) }
    )

    ensureError (
      { remoteService => (remoteService.wipeDir _).expects(*).anyNumberOfTimes().throws(new Exception()) },
      { (service, agentPath, targets) => service.pushPlugins(agentPath, targets) }
    )

    ensureError (
      { remoteService => //noinspection ScalaUnnecessaryParentheses
        (remoteService.retrieveFile(_: String)(_: InputStream => Unit)).expects(*, *).anyNumberOfTimes().throws(new Exception()) },
      { (service, agentPath, targets) => service.pullPlugins(agentPath, targets) }
    )

    ensureError (
      { remoteService => (remoteService.transferFile _).expects(*, *).anyNumberOfTimes().throws(new Exception()) },
      { (service, agentPath, targets) => service.pushPlugins(agentPath, targets) }
    )

    ensureError (
      { remoteService => (remoteService.close _).expects().anyNumberOfTimes().throws(new Exception()) },
      { (service, agentPath, targets) => service.refreshSync(agentPath, targets) }
    )
    ensureError (
      { remoteService => (remoteService.close _).expects().anyNumberOfTimes().throws(new Exception()) },
      { (service, agentPath, targets) => service.pullPlugins(agentPath, targets) }
    )
    ensureError (
      { remoteService => (remoteService.close _).expects().anyNumberOfTimes().throws(new Exception()) },
      { (service, agentPath, targets) => service.pushPlugins(agentPath, targets) }
    )
  }
  
  private def createSyncTarget(seed: String) = {
    SyncTarget(seed, PlatformHost(seed, "", Some(s"host$seed")), s"$rootPluginDir/abc/service$seed/$seed", s"dir $seed")
  }

  private def hostname(target: SyncTarget) = target.host.hostname getOrElse (throw new Exception())

  private def libName(seed: Int) = s"plugin$seed.lib"
  
  private def libContent(seed: Int) = s"content $seed"

  private def pseudoRemoteRoot(host: String) = {
    val dir = new File(remoteDir, host)
    ensureDirExists(dir)
  }

  private def pseudoRemoteFile(host: String, path: String) = {
    new File(pseudoRemoteRoot(host), path)
  }

  private def libPath(target: SyncTarget, seed: Int) = {
    val path = target.dir + "/" + target.subDir + "/lib/" + libName(seed)
    pseudoRemoteFile(hostname(target), path)
  }

  private def cleanFiles() = FileUtils.deleteDirectory(testDir)

  private def writeRemoteLib(target: SyncTarget, seed: Int) = {
    FileUtils.writeStringToFile(libPath(target, seed), libContent(seed))
  }
  
  private def verifyRemotePlugins(target: SyncTarget, seeds: List[Int]) = {
    val path1 = target.dir
    verifyDir(pseudoRemoteFile(hostname(target), path1), Set(target.subDir))
    val path2 = path1 + "/" + target.subDir
    verifyDir(pseudoRemoteFile(hostname(target), path2), Set("lib"))
    val path3 = path2 + "/" + "lib"
    val names = seeds map libName
    verifyDir(pseudoRemoteFile(hostname(target), path3), names.toSet)
    seeds foreach { seed =>
      verifyFileContent(libPath(target, seed), libContent(seed))
    }
  }
  
  private def verifyFileContent(file: File, content: String) = {
    file shouldBe 'exists
    FileUtils.readFileToString(file) should be (content)
  }

  private def verifyDir(dir: File, names: Set[String]) = {
    val actual = Option(dir.listFiles()) getOrElse Array[File]()
    actual.length should be (names.size)
    actual foreach { file =>
      names.contains(file.getName) should be (true)
    }
  }

  private def createPluginService(): FlumeLocalRepo = {
    createPluginService(stubRemoteAccessRouter())
  }

  private def createPluginService(remoteAccessRouter: RemoteAccessServiceRouter): FlumeLocalRepo = {
    val accessManager = mock[AccessManagerService]
    val flumeCompDao = mock[FlumeComponentDao]
    (accessManager.findPlatformAccess _).stubs(*) onCall { platformId: Int =>
      Some(PlatformHostAccess(Some(platformId), platformId, Some("user"), Some("password"), None, List(rootPluginDir)))
    }

    implicit object DiModule extends Module {
      bind [AccessManagerService] to accessManager
      bind [RemoteAccessServiceRouter] to remoteAccessRouter
      bind [FlumeComponentDao] to flumeCompDao
    }

    new FlumeLocalRepoImpl(repositoryDir, "")
  }

  private def stubRemoteAccessRouter() = {
    val remoteAccessRouter = mock[RemoteAccessServiceRouter]

    (remoteAccessRouter.getPassBasedService _).stubs(*,*,*,*) onCall { (host: String, port: Int, user: String, password: String) =>
      val remoteService = mock[RemoteAccessService]
      stubRemoteService(remoteService, host)
    }

    remoteAccessRouter
  }

  def stubRemoteService(remoteService: RemoteAccessService, host: String) = {
    val unit = {}
    def resolve: String => File = pseudoRemoteFile(host, _)

    (remoteService.listFiles _).stubs(*) onCall { path: String =>
      val dir = resolve(path)
      val moduleFiles = collectModuleFiles(dir, path, ComponentFS.fileOnly + 1, includeDirectories = true) filterNot (_.path == path)
      moduleFiles map { moduleFile =>
        RemoteFile(ModuleFileCommon.name(moduleFile.path), moduleFile.`type` == ModuleFileCommon.dir, 666, moduleFile.size)
      }
    }

    (remoteService.mkDirs _).stubs(*) onCall { path: String =>
      ensureDirExists(resolve(path))
      unit
    }

    (remoteService.wipeDir _).stubs(*) onCall { path: String =>
      val dir = resolve(path)
      FileUtils.deleteQuietly(dir)
      ensureDirExists(dir)
      unit
    }

    (remoteService.wipeDir _).stubs(*) onCall { path: String =>
      val dir = resolve(path)
      FileUtils.deleteQuietly(dir)
      unit
    }

    //noinspection ScalaUnnecessaryParentheses
    (remoteService.retrieveFile(_: String)(_: InputStream => Unit)).stubs(*, *) onCall { (path: String, read: InputStream => Unit) =>
      managed2(new FileInputStream(resolve(path)))(read)
    }

    (remoteService.transferFile _).stubs(*, *) onCall { (file: File, path: String) =>
      val destination = resolve(path)
      FileUtils.copyFile(file, destination)
      unit
    }

    (remoteService.close _).expects().anyNumberOfTimes().returns(unit)

    remoteService
  }

}
