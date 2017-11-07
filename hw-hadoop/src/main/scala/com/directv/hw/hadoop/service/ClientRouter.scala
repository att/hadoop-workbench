package com.directv.hw.hadoop.service

import com.directv.hw.core.exception.AccessException
import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.access.AccessManagerService
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.persistence.dao.ClusterDao
import com.typesafe.scalalogging.LazyLogging

trait ClientRouter[T] {

  self: LazyLogging =>

  protected def clusterDao: ClusterDao
  protected def accessManager: AccessManagerService
  protected def appConf: AppConf

  protected def createTeamClient(clusterPath: ClusterPath, team: String)
                                (simpleFactory: String => T, kerberizedFactory: (String, String) => T): T = {

    val (name, key) = accessManager.getTeamCreds(clusterPath, team)
    createClient(clusterPath)(name, key.map(_.toString), simpleFactory, kerberizedFactory)
  }

  protected def createUserClient(clusterPath: ClusterPath, userId: Int)
                                (simpleFactory: String => T, kerberizedFactory: (String, String) => T): T = {

      val (name, key) = accessManager.getUserCreds(clusterPath, userId)
      createClient(clusterPath)(name, key.map(_.toString), simpleFactory, kerberizedFactory)
  }

  private def createClient(clusterPath: ClusterPath)(name: String, key: Option[String],
                                                     simpleFactory: String => T,
                                                     kerberizedFactory: (String, String) => T): T = {

    val clusterSettings = clusterDao.getClusterSettings(clusterPath).getOrElse {
      throw new AccessException(s"Cluster [$clusterPath] is not configured  ")
    }

    if (clusterSettings.kerberized) {
      logger.debug(s"creating kerberized service client for user $name")
      val pathValue = key.getOrElse(throw new AccessException(s"keytab is not defined to user [$name]"))
      kerberizedFactory(name, pathValue)
    } else {
      simpleFactory(name)
    }
  }
}
