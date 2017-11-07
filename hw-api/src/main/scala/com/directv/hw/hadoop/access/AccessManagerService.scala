package com.directv.hw.hadoop.access

import java.io.InputStream
import java.nio.file.Path

import com.directv.hw.core.access.SrvUser
import com.directv.hw.hadoop.access.KeyTypes.KeyType
import com.directv.hw.hadoop.hdfs.model.HdfsAccessInfo
import com.directv.hw.hadoop.host.model.PlatformHostAccess
import com.directv.hw.hadoop.oozie.model.OozieAccessInfo
import com.directv.hw.hadoop.model.ClusterPath

trait AccessManagerService {
  def getKeys(`type`: KeyType,
              owner: Option[String] = None,
              platformId: Option[Int] = None,
              clusterId: Option[String] = None): List[KeyFile]

  def getTeamCreds(clusterPath: ClusterPath, team: String): (String, Option[Path])
  def getUserCreds(clusterPath: ClusterPath, userId: Int): (String, Option[Path])
  def getKeyFileById(id: Int): (KeyFile, Path)
  def uploadKeyFile(key: KeyFile, input: InputStream): Int
  def updateKeyFile(key: KeyFileInfo): Unit
  def deleteKeyFile(id: Int)
  def createKeyTab(principal: String, password: String, key: KeyFile): Int
  def generateClusterCreds(user: String, password: String): Unit

  def findSrvUsers(platformId: Option[Int] = None,
                   clusterId: Option[String] = None,
                   owner: Option[String] = None): List[SrvUser]

  def findLoginKey(`type`: KeyType, owner: String, realm: String): Option[(KeyFile, Path)]

  def getSrvUser(id: Int): SrvUser
  def addSrvUser(hwUser: SrvUser): Int
  def updateSrvUser(user: SrvUser): Unit
  def deleteSrvUser(id: Int): Unit

  def findPlatformAccess(platformId: Int): Option[PlatformHostAccess]
  def savePlatformAccess(access: PlatformHostAccess)
  def deletePlatformAccess(platformId: Int)

  def findHdfsAccess(clusterPath: ClusterPath): Option[HdfsAccessInfo]
  def save(clusterPath: ClusterPath, hdfs: HdfsAccessInfo): Unit
  def resolveHdfsUser(clusterPath: ClusterPath, userName: String): Option[SrvUser]

  def findCustomClusterProperties(clusterPath: ClusterPath): List[CustomClusterProperty]
  def findClusterEnvironments(clusterPath: ClusterPath): List[String]
  def save(clusterPath: ClusterPath, properties: List[CustomClusterProperty]): Unit
  def removeCustomClusterProperties(clusterPath: ClusterPath): Unit

  def findOozieAccess(clusterPath: ClusterPath): Option[OozieAccessInfo]
  def saveOozieAccess(clusterPath: ClusterPath, oozieAccess: OozieAccessInfo)
  def updateOozieAccess(clusterPath: ClusterPath, access: OozieAccessInfo)
  def resolveOozieUser(clusterPath: ClusterPath, userName: String): Option[SrvUser]

  def getAllClusterRealms: List[String]
  def getClusterSettings(clusterPath: ClusterPath): Option[ClusterSettings]
  def saveClusterSettings(clusterPath: ClusterPath, clusterSettings: ClusterSettings): Unit
}
