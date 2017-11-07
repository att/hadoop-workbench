package com.directv.hw.hadoop.platform.service

import com.directv.hw.core.service.HadoopConfigNames.HadoopConfigName
import com.directv.hw.hadoop.cluster.ConfigUpdate
import com.directv.hw.hadoop.host.model.PlatformHost
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.hadoop.oozie.model.OozieAccessInfo
import com.directv.hw.hadoop.platform.model._
import com.directv.hw.hadoop.platform.model.ping.PingStatus

import scala.concurrent.Future
import scala.util.Try

trait PlatformManager {
  def getServiceTypes: List[ServiceType]
  def getPlatform(id: Int): Platform
  def getBriefPlatforms: List[PlatformInfo]
  def getPlatformHost(id: Int): Option[String]
  def getBriefPlatform(platformId: Int): PlatformInfo
  def getClusters(platformId: Int): List[ClusterInfo]
  def getCachedClusters(platformId: Int): List[ClusterInfo]
  def getAllCachedClusters: List[ClusterInfo]
  def getServices(clusterPath: ClusterPath): List[ServiceInfo]
  def getPlatformStatus(platformId: Int): Future[Try[PingStatus]]

  def getHosts(clusterPath: ClusterPath): List[PlatformHost]
  def findDbClusters(platformId: Int): List[ClusterInfo]
  def getClientConfigs(clusterPath: ClusterPath): Map[String, String]
  def getLastConfigUpdate(clusterPath: ClusterPath): Option[ConfigUpdate]
  def readClientConfig(clusterPath: ClusterPath, fileName: HadoopConfigName): Option[String]
  def getFullPlatforms: List[Platform]
  def addPlatform(platform: Platform): Int
  def updatePlatform(platform: Platform)
  def deletePlatform(platformId: Int)
  def deletePlatformByInstallationId(instId: String): Unit
  def getInstallationIdForPlatform(platformId: Int): Option[String]
}
