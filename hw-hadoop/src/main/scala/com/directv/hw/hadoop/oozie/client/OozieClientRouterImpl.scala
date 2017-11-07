package com.directv.hw.hadoop.oozie.client

import com.directv.hw.core.exception.ConfigurationException
import com.directv.hw.core.plugin.DapPluginManager
import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.access.{AccessManagerService, AccessProtocol}
import com.directv.hw.hadoop.config.ClusterServiceNames
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.hadoop.service.ClientRouter
import com.directv.hw.persistence.dao.{ClusterDao, ClusterServiceDao}
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}


class OozieClientRouterImpl(pluginId: String)(implicit injector: Injector)
  extends ClientRouter[OozieClient] with OozieClientRouter with Injectable with LazyLogging{

  protected lazy val accessManager: AccessManagerService = inject[AccessManagerService]
  protected lazy val clusterDao: ClusterDao = inject[ClusterDao]
  protected lazy val appConf: AppConf = inject[AppConf]

  private val pluginManager = inject[DapPluginManager]
  private val clusterServiceDao = inject[ClusterServiceDao]
  private val factory = pluginManager.getExtension(pluginId, classOf[OozieClientFactory])

  override def getOozieClient(clusterPath: ClusterPath, team: Option[String]): OozieClient = {

    val url = clusterServiceDao.findService(clusterPath, ClusterServiceNames.oozie).map(_.url).getOrElse {
      throw ConfigurationException("couldn't resolve oozie url")
    }

    def simpleFactory(user: String) = factory.getOozieClient(OozieSimpleClientConfig(url, user))
    def kerberizedFactory(user: String, keyPath: String) = {
      factory.getKrbOozieClient(OozieKrbClientConfig(url, user, keyPath))
    }

    createTeamClient(clusterPath, team.getOrElse(appConf.defaultTeam))(simpleFactory, kerberizedFactory)
  }
}
