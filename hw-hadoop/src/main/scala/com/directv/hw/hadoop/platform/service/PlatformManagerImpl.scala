package com.directv.hw.hadoop.platform.service

import akka.actor.ActorSystem
import akka.util.Timeout
import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.core.service.HadoopConfigNames.HadoopConfigName
import com.directv.hw.core.service.{AppConf, HadoopServiceRegistry, PropertyService}
import com.directv.hw.hadoop.cluster.ConfigUpdate
import com.directv.hw.hadoop.config.{ClusterConfigService, ClusterServiceResolver}
import com.directv.hw.hadoop.host.model.PlatformHost
import com.directv.hw.hadoop.http.client.ConnectionException
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.hadoop.platform.PlatformTypes
import com.directv.hw.hadoop.platform.exception.PlatformNotFoundException
import com.directv.hw.hadoop.platform.model._
import com.directv.hw.hadoop.platform.model.ping._
import com.directv.hw.persistence.dao._
import com.directv.hw.persistence.entity._
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}

import scala.concurrent.duration._
import scala.concurrent.{ExecutionContext, Future}
import scala.language.postfixOps
import scala.util.{Failure, Success, Try}

class PlatformManagerImpl(clientRouters: Map[String, ((Int) => PlatformClient)])
                         (implicit val injector: Injector) extends PlatformManager with Injectable with LazyLogging {

  private val serviceRegistry = inject[HadoopServiceRegistry]
  private val platformDao = inject[PlatformDao]
  private val installationDao = inject[PlatformInstallationDao]
  private val clusterDao = inject[ClusterDao]
  private val propertyService = inject[PropertyService]
  private val actorSystem: ActorSystem = inject[ActorSystem]
  private val dispatcherFactory = inject[DispatcherFactory]
  private val appConf = inject[AppConf]
  private val clusterConfigService = inject[ClusterConfigService]
  private val clusterServiceResolver = inject[ClusterServiceResolver]
  private val configUpdateDao = inject[ClusterConfigUpdateDao]
  private val keyStoreDao = inject[KeyStoreDao]
  private val userDao = inject[ServiceUserDao]

  private implicit val executionContext: ExecutionContext = dispatcherFactory.auxiliaryDispatcher

  override def getServiceTypes: List[ServiceType] = serviceRegistry.getRegisteredTypes

  override def getBriefPlatforms: List[PlatformInfo] = {
    platformDao.getAllPlatforms map toBriefPlatformInfo
  }

  override def getPlatformHost(id: Int): Option[String] = {
    try {
      val host = platformDao.findPlatformById(id)._2.host
      if (host.nonEmpty) Some(host)
      else None
    } catch {
      case PlatformNotFoundException(_) => None
    }
  }

  def getBriefPlatform(platformId: Int): PlatformInfo = {
    toBriefPlatformInfo(platformDao.findPlatformById(platformId))
  }

  override def getClusters(platformId: Int): List[ClusterInfo] = {
    val clusters = platformClient(platformId).getClusters
    saveDbClusters(platformId, clusters)
    clusters
  }

  override def getCachedClusters(platformId: Int): List[ClusterInfo] = {
    clusterDao.findByPlatform(platformId).map(toModel)
  }

  def getAllCachedClusters: List[ClusterInfo] = {
    clusterDao.getAll.map(toModel)
  }

  override def getServices(clusterPath: ClusterPath): List[ServiceInfo] = {
    platformClient(clusterPath.platformId).getServices(clusterPath.clusterId)
  }

  override def getHosts(clusterPath: ClusterPath): List[PlatformHost] = {
    platformClient(clusterPath.platformId).getHosts(clusterPath.clusterId)
  }

  private def toBriefPlatformInfo(tuple: (PlatformEntity, ApiEntity)) = {
    val (platform, api) = tuple
    PlatformInfo(platform.id.get, platform.description, api.host, platform.`type`)
  }

  override def findDbClusters(platformId: Int): List[ClusterInfo] = {
    clusterDao.findByPlatform(platformId) map (e =>  ClusterInfo(e.clusterId, e.name))
  }

  private def saveDbClusters(platformId: Int, clusters: List[ClusterInfo]): Unit = {
    clusterDao.save(clusters map (c => ClusterEntity(platformId, c.id, c.title)))
    clusterDao.retain(platformId, clusters map (_.id))
  }

  override def getClientConfigs(clusterPath: ClusterPath): Map[String, String] = {
    val client = platformClient(clusterPath.platformId)
    client.retrieveClientConfigs(clusterPath.clusterId)
  }

  override def getLastConfigUpdate(clusterPath: ClusterPath): Option[ConfigUpdate] = {
    configUpdateDao.find(clusterPath).map(toService)
  }

  private def toService(entity: ClusterConfigUpdateEntity) = {
    ConfigUpdate(entity.success, entity.date)
  }

  override def readClientConfig(clusterPath: ClusterPath, fileName: HadoopConfigName): Option[String] = {
    clusterConfigService.getConfig(clusterPath, fileName)
  }

  override def getFullPlatforms: List[Platform] = {
    val installationsByPlatformId = installationDao.getAllInstallations.map(e => e.platformId -> e).toMap
    platformDao.getAllPlatforms.map { case (platform, api) =>
      toPlatform(platform, api, installationsByPlatformId.get(platform.id.get))
    }
  }

  override def getPlatform(id: Int): Platform = {
    val installation = installationDao.findInstallationByPlatformId(id)
    val (platform, api) = platformDao.findPlatformById(id)
    toPlatform(platform, api, installation)
  }

  override def addPlatform(platform: Platform): Int = {
    val (platformEntity, apiEntity) = toEntity(platform)
    val platformId = platformDao.addPlatform(platformEntity, apiEntity)

    // workaround for single service platforms
    if (platform.`type` == PlatformTypes.Kafka.toString) {
      clusterDao.save(ClusterEntity(platformId, "Cluster1", "Cluster1"))
    }

    platformId
  }

  override def updatePlatform(platform: Platform): Unit = {
    val (platformEntity, apiEntity) = toEntity(platform)
    platformDao.updatePlatform(platformEntity, apiEntity)
  }

  override def deletePlatform(platformId: Int): Unit = {
    deletePlatformKeys(platformId)
    platformDao.deletePlatform(platformId)
    clusterDao.retain(platformId, List.empty)
    propertyService.deleteAllForPlatform(platformId)
    clusterConfigService.deleteConfigs(platformId)
  }

  override def deletePlatformByInstallationId(instId: String): Unit = {
    installationDao.findInstallationById(instId).foreach { installation =>
      deletePlatformKeys(installation.platformId)
      platformDao.deletePlatform(installation.platformId)
      clusterConfigService.deleteConfigs(installation.platformId)
    }
  }

  private def deletePlatformKeys(platformId: Int): Unit = {
    clusterDao.getAll.foreach { cluster =>
      val clusterPath = new ClusterPath(cluster.platformId, cluster.clusterId)
      keyStoreDao.deleteKeys(clusterPath)
    }
  }

  override def getInstallationIdForPlatform(platformId: Int): Option[String] = {
    installationDao.findInstallationByPlatformId(platformId).map(_.id)
  }

  override def getPlatformStatus(platformId: Int): Future[Try[PingStatus]] = {
    implicit val timeout: Timeout = Timeout(appConf.outgoingHttpRqTimeoutMs millis)
    logger.trace(s"get platform status for id [$platformId]")
    Future { pingStatus(platformId) }
  }

  private def pingStatus(platformId: Int): Try[PingStatus] = {
    try {
      logger.trace("ping platform for id: " + platformId)
      platformClient(platformId).getClusters // ping call
      Success(PingSuccess)
    } catch {
      case ConnectionException(_, _) => Success(NoResponse)
      case e: Throwable => Failure(e)
    }
  }

  private def platformClient(platformId: Int): PlatformClient = {
    val (platform, _) = platformDao.findPlatformById(platformId)
    clientRouters(platform.`type`)(platformId)
  }

  private def toModel(a: ApiEntity): Api = {
    Api(a.`type`, a.version, a.host, a.port, a.protocol, a.user, a.password, a.keyId)
  }

  private def toPlatform(p: PlatformEntity, a: ApiEntity, iOpt: Option[PlatformInstallationEntity]): Platform ={
    Platform(p.id, p.`type`, p.version, p.description, p.location, toModel(a), iOpt.map(_.id))
  }

  private def toModel(entity: ClusterEntity): ClusterInfo = {
    ClusterInfo(entity.clusterId, entity.name)
  }

  private def toEntity(a: Api): ApiEntity = {
    ApiEntity(None, a.`type`, a.version, a.host, a.port, a.protocol, a.userName, a.password, a.keyId)
  }

  private def toEntity(p: Platform): (PlatformEntity, ApiEntity) = {
    val platformEntity = PlatformEntity(p.id, p.`type`, p.version, p.description, p.location, -1)
    (platformEntity, toEntity(p.api))
  }

}
