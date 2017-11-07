package com.directv.hw.hadoop.platform.service

import com.directv.hw.hadoop.platform.model.{ClusterInstallation, PlatformLocation}
import com.directv.hw.persistence.dao.{ClusterDao, PlatformDao, PlatformInstallationDao}
import com.directv.hw.persistence.entity._
import scaldi.{Injectable, Injector}
import ClusterInstallatorBase._
import com.directv.hw.core.exception.ConfigurationException

object ClusterInstallatorBase {
  val UrlPattern = "([a-z]+)://(.*):([0-9]+).*".r
}

abstract class ClusterInstallatorBase(implicit injector: Injector) extends ClusterInstallator with Injectable {

  protected val platformDao = inject[PlatformDao]
  protected val installationDao = inject[PlatformInstallationDao]
  protected val clusterDao = inject[ClusterDao]

  def addCluster(cluster: ClusterInstallation, user: String): Unit = {

    val (protocol, host, port)  = cluster.managerUrl.map {
      case UrlPattern(protocol_, host_, port_) =>
        (protocol_, host_, port_.toInt)
      case unknown => throw ConfigurationException("unknown manager url pattern: " + unknown);
    }.getOrElse(("", "", 0))

    val api = ApiEntity (
      None,
      cluster.distType,
      None,
      host,
      port,
      protocol,
      cluster.managerUser,
      cluster.managerPassword
    )

    val platform = PlatformEntity (
      None,
      cluster.distType,
      cluster.distVersion,
      cluster.title,
      cluster.location,
      -1
    )

    val id = platformDao.addPlatform(platform, api)

    installationDao.addInstallation (
      PlatformInstallationEntity (
        cluster.installationId,
        id,
        cluster.clusterId,
        cluster.distType,
        cluster.distVersion,
        cluster.location
      )
    )

    clusterDao.save(ClusterEntity(id, cluster.clusterId, cluster.title))
    clusterDao.saveClusterSettings(ClusterSettingsEntity(id, cluster.clusterId))
    configureServices(id, cluster.clusterId, user)
  }

  protected def configureServices(platfromId: Int, clusterId: String, user: String): Unit
}
