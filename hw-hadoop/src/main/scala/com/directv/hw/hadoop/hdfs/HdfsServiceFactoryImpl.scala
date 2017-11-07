package com.directv.hw.hadoop.hdfs

import java.nio.file.Path

import com.directv.hw.core.exception.{AccessException, ConfigurationException}
import com.directv.hw.hadoop.access.AccessManagerService
import com.directv.hw.hadoop.http.client.{KrbCredentials, SimpleCredentials}
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.persistence.dao.ClusterDao
import scaldi.{Injectable, Injector}

class HdfsServiceFactoryImpl(implicit injector: Injector) extends HdfsServiceFactory with Injectable {

  private val accessManager = inject[AccessManagerService]
  private val clusterDao = inject[ClusterDao]

  override def byTeam(clusterPath: ClusterPath, team: String): HdfsService = {
    val (login, key) = accessManager.getTeamCreds(clusterPath, team)
    val credentials = getCredentials(clusterPath, login, key)
    new HdfsServiceImpl(clusterPath, credentials)
  }

  private def getCredentials(clusterPath: ClusterPath, login: String, key: Option[Path]) = {
    val kerberized = clusterDao.getClusterSettings(clusterPath).exists(_.kerberized)
    if (kerberized) {
      val keyPath = key.getOrElse(throw ConfigurationException(s"Keytab is not defined for principal $login"))
      KrbCredentials(login, keyPath)
    } else {
      SimpleCredentials(login)
    }
  }

  override def byUserId(clusterPath: ClusterPath, srvUserId: Option[Int], localUser: String): HdfsService = {
    val (login, key) = srvUserId match {
      case Some(id) =>
        val srvUser = accessManager.getSrvUser(id)
        if (srvUser.owner.isDefined && srvUser.owner.get != localUser) {
          throw new AccessException(s"Private service user [$srvUserId] doesn't belong to logged in user")
        }

        accessManager.getUserCreds(clusterPath, id)
      case None =>
        val privateUsers = accessManager.findSrvUsers(Some(clusterPath.platformId), Some(clusterPath.clusterId), Some(localUser))
        val srvUser = privateUsers.headOption.getOrElse {
          throw new AccessException(s"Service credentials haven't been found. Re-login and try again.")
        }

        (srvUser.name, srvUser.keyId.map(accessManager.getKeyFileById).map(_._2))
    }

    val credentials = getCredentials(clusterPath, login, key)
    new HdfsServiceImpl(clusterPath, credentials)
  }
}
