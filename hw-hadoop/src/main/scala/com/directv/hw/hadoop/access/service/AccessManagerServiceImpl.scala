package com.directv.hw.hadoop.access.service

import java.io.InputStream
import java.nio.file.{Files, Path, Paths}

import com.directv.hw.core.access.SrvUser
import com.directv.hw.core.exception.ConfigurationException
import com.directv.hw.core.service.AppConf
import com.directv.hw.core.settings.UserSettings
import com.directv.hw.hadoop.access.KeyTypes.KeyType
import com.directv.hw.hadoop.access._
import com.directv.hw.hadoop.hdfs.model.HdfsAccessInfo
import com.directv.hw.hadoop.host.model.PlatformHostAccess
import com.directv.hw.hadoop.oozie.model.OozieAccessInfo
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.persistence.dao._
import com.directv.hw.persistence.entity._
import org.apache.directory.server.kerberos.shared.crypto.encryption.KerberosKeyFactory
import org.apache.directory.server.kerberos.shared.keytab.{Keytab, KeytabEntry}
import org.apache.directory.shared.kerberos.KerberosTime
import scaldi.{Injectable, Injector}

import scala.collection.JavaConversions._
import scala.language.postfixOps

class AccessManagerServiceImpl(implicit injector: Injector) extends AccessManagerService with Injectable
  with AccessModelConverter {

  private val pluginDirSeparator = "\n"
  private val keyStoreDao = inject[KeyStoreDao]
  private val platformAccessDao = inject[PlatformAccessDao]
  private val hdfsAccessDao = inject[HdfsAccessDao]
  private val oozieAccessDao = inject[OozieAccessDao]
  private val settingsDao = inject[SettingsDao]
  private val appConf = inject[AppConf]
  private val userDao = inject[ServiceUserDao]
  private val clusterDao = inject[ClusterDao]
  private val customClusterDataDao = inject[CustomClusterDataDao]

  override def getKeys(`type`: KeyType,
                       owner: Option[String],
                       platformId: Option[Int],
                       clusterId: Option[String]): List[KeyFile] = {

    keyStoreDao.getKeys(`type`, owner, platformId, clusterId)
  }

  override def getTeamCreds(clusterPath: ClusterPath, team: String): (String, Option[Path]) = {
    val users = userDao.users(Some(clusterPath.platformId), Some(clusterPath.clusterId), team = Some(team))
    if (users.isEmpty) throw ConfigurationException(s"No user is assigned to a team '$team'")
    if (users.size > 1) throw ConfigurationException(s"more than one user assigned to a team '$team'")
    val user = users.head
    val key =  user.keyId.map(id => keyStoreDao.getById(id)._2)
    (user.name, key)
  }

  override def getUserCreds(clusterPath: ClusterPath, userId: Int): (String, Option[Path]) = {
    val user = userDao.userById(userId)
    val path = user.keyId.map(keyStoreDao.getById(_)._2)
    (user.name, path)
  }


  override def getKeyFileById(id: Int): (KeyFile, Path) = {
    keyStoreDao.getById(id)
  }

  override def uploadKeyFile(key: KeyFile, input: InputStream): Int = {
    keyStoreDao.addKey(key, input)
  }

  override def updateKeyFile(key: KeyFileInfo): Unit = {
    keyStoreDao.updateKey(key)
  }

  override def deleteKeyFile(id: Int): Unit = {
    keyStoreDao.deleteKey(id)
  }

  override def createKeyTab(principal: String, password: String, key: KeyFile): Int = {
    if (principal.isEmpty || !principal.contains("@")) {
      throw new IllegalArgumentException(s"not valid principal: [$principal]")
    }

    val path = createKeyTabFile(principal, password)
    val is = Files.newInputStream(path)
    try {
      keyStoreDao.addKey(key, is)
    } finally {
      is.close()
      Files.delete(path)
    }
  }

  override def generateClusterCreds(user: String, password: String): Unit = {
    clusterDao.getAll.foreach { cluster =>
      val clusterPath = new ClusterPath(cluster.platformId, cluster.clusterId)
      userDao.deletePrivateUsers(clusterPath, user)
      keyStoreDao.deletePrivateKeys(clusterPath, user)
      clusterDao.getClusterSettings(clusterPath).foreach { settings =>
        if (settings.kerberized && settings.realm.isDefined) {
          val name = s"$user@${settings.realm.get}"
          val path = createKeyTabFile(name, password)
          val is = Files.newInputStream(path)
          try {
            val key = KeyFile (
              None, KeyTypes.keyTab, name,
              owner = Some(user),
              platformId = Some(cluster.platformId),
              clusterId = Some(cluster.clusterId)
            )

            val keyId = keyStoreDao.addKey(key, is)
            val srvUser = SrvUser (
              None, name,
              owner = Some(user),
              keyId = Some(keyId),
              homePath = Some(s"/user/$user"),
              platformId = Some(cluster.platformId),
              clusterId = Some(cluster.clusterId)
            )

            userDao.addUser(srvUser)
          } finally {
            is.close()
            Files.delete(path)
          }
        } else if (!settings.kerberized) {
          val srvUser = SrvUser (
            None, user,
            owner = Some(user),
            homePath = Some(s"/user/$user"),
            platformId = Some(cluster.platformId),
            clusterId = Some(cluster.clusterId)
          )

          userDao.addUser(srvUser)
        }
      }
    }
  }

  private def createKeyTabFile(principal: String, password: String): Path = {
    val dir = Paths.get(appConf.accessKeyDir).resolve("generated")
    Files.createDirectories(dir)
    val path = Files.createTempFile(dir, "", ".keytab")

    val keytab = Keytab.getInstance
    val timeStamp = new KerberosTime
    val principalType = 1

    val entries = KerberosKeyFactory.getKerberosKeys(principal, password).entrySet.toList.map { entry =>
      val key = entry.getValue
      val keyVersion = key.getKeyVersion.toByte
      new KeytabEntry(principal, principalType, timeStamp, keyVersion, key)
    }

    keytab.setEntries(entries)
    keytab.write(path.toFile)
    path
  }

  override def findSrvUsers(platformId: Option[Int], clusterId: Option[String], owner: Option[String]): List[SrvUser] = {
    userDao.users(platformId, clusterId, owner)
  }

  override def findLoginKey(`type`: KeyType, owner: String, realm: String): Option[(KeyFile, Path)] = {
    keyStoreDao.getLoginKeyByRealm(owner, realm, `type`)
  }

  override def getSrvUser(id: Int): SrvUser = {
    userDao.userById(id)
  }

  override def addSrvUser(user: SrvUser): Int = {
    userDao.addUser(user)
  }

  override def updateSrvUser(user: SrvUser): Unit = {
    userDao.updateUser(user)
  }

  override def deleteSrvUser(id: Int): Unit = {
    userDao.deleteUser(id)
  }

  override def findPlatformAccess(platformId: Int): Option[PlatformHostAccess] = {
    platformAccessDao.getPlatformAccess(platformId) map { e =>
      val pluginDirs: List[String] = e.pluginDirs map toPluginDirList getOrElse List.empty
      PlatformHostAccess(e.id, e.port, e.userName, e.password, e.keyFileId, pluginDirs)
    }
  }

  override def savePlatformAccess(a: PlatformHostAccess): Unit = {
    val pluginDirs = toCombinedPluginDir(a.pluginDirs)
    val entity = PlatformAccessEntity(a.id, a.port, a.userName, a.password, a.keyFileId, pluginDirs)
    platformAccessDao.savePlatformAccess(entity)
  }

  override def deletePlatformAccess(platformId: Int): Unit = {
    platformAccessDao.deletePlatformAccess(platformId)
  }

  override def findHdfsAccess(clusterPath: ClusterPath): Option[HdfsAccessInfo] = {
    hdfsAccessDao.findByCluster(clusterPath) map toHdfsInfo
  }


  private def toHdfsInfo(hdfs: HdfsAccessEntity) = {
    HdfsAccessInfo (
      hdfs.userId
    )
  }

  override def save(clusterPath: ClusterPath, hdfs: HdfsAccessInfo): Unit = {
    val hdfsEntity = HdfsAccessEntity (
      clusterPath.platformId,
      clusterPath.clusterId,
      hdfs.userId
    )

    hdfsAccessDao.save(hdfsEntity)
  }

  override def resolveHdfsUser(clusterPath: ClusterPath, localUser: String): Option[SrvUser] = {
    resovleSrvUserInSettings(localUser, settings => settings.hdfsUserId).orElse {
      hdfsAccessDao.findByCluster(clusterPath).flatMap { access =>
        access.userId.map(id => userDao.userById(id))
      }
    }
  }

  override def resolveOozieUser(clusterPath: ClusterPath, localUser: String): Option[SrvUser] = {
    resovleSrvUserInSettings(localUser, settings => settings.oozieUserId).orElse {
      oozieAccessDao.findByCluster(clusterPath).flatMap { access =>
        access.userId.map(id => userDao.userById(id))
      }
    }
  }

  private def resovleSrvUserInSettings(localUser: String, resolveId: UserSettings => Option[Int]): Option[SrvUser with Product with Serializable] = {
    settingsDao.getUserSettings(localUser).flatMap { settings =>
      resolveId(settings).map(id => userDao.userById(id))
    }
  }

  def toPluginDirList(s: String): List[String] = s split pluginDirSeparator map(_.trim) toList

  def toCombinedPluginDir(dirs: List[String]): Option[String] = {
    if (dirs.nonEmpty) {
      Some(dirs mkString pluginDirSeparator)
    } else {
      None
    }
  }


  /******      OOZIE ACCESS      ********/
  override def findOozieAccess(clusterPath: ClusterPath): Option[OozieAccessInfo] = {
    oozieAccessDao.findByCluster(clusterPath) map toOozieInfo
  }

  private def toOozieInfo(oozie: OozieAccessEntity) = {
    OozieAccessInfo (
      oozie.userId
    )
  }

  override def updateOozieAccess(clusterPath: ClusterPath, access: OozieAccessInfo): Unit = {
    val oozieEntity = OozieAccessEntity (
      clusterPath.platformId,
      clusterPath.clusterId,
      access.userId
    )

    oozieAccessDao.save(oozieEntity)
  }

  override def saveOozieAccess(clusterPath: ClusterPath, oozie: OozieAccessInfo): Unit = {
    val oozieEntity = OozieAccessEntity (
      clusterPath.platformId,
      clusterPath.clusterId,
      oozie.userId
    )

    oozieAccessDao.save(oozieEntity)
  }

  override def findCustomClusterProperties(clusterPath: ClusterPath): List[CustomClusterProperty] = {
    customClusterDataDao.findByCluster(clusterPath).map(toModel)
  }

  override def findClusterEnvironments(clusterPath: ClusterPath): List[String] = {
    val basePathPattern = "(.*)_basepath".r

    customClusterDataDao.findByCluster(clusterPath).map(_.key).collect {
      case basePathPattern(env) => env
    }
  }

  override def removeCustomClusterProperties(clusterPath: ClusterPath): Unit = {
    customClusterDataDao.delete(clusterPath)
  }

  override def save(clusterPath: ClusterPath, properties: List[CustomClusterProperty]): Unit = {
    customClusterDataDao.save(clusterPath, properties.map(prop => toEntity(clusterPath, prop)))
  }

  override def getAllClusterRealms: List[String] = {
    clusterDao.getAllRealms
  }

  override def getClusterSettings(clusterPath: ClusterPath): Option[ClusterSettings] = {
    clusterDao.getClusterSettings(clusterPath).map(toModel)
  }

  override def saveClusterSettings(clusterPath: ClusterPath, clusterSettings: ClusterSettings): Unit = {
    clusterDao.saveClusterSettings(toEntity(clusterPath, clusterSettings))
  }
}
