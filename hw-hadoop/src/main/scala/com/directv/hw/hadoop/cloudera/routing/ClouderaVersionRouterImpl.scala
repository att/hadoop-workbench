package com.directv.hw.hadoop.cloudera.routing

import com.directv.hw.core.exception.CalleeException
import com.directv.hw.core.plugin.DapPluginManager
import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.access.AccessProtocol
import com.directv.hw.hadoop.cloudera.ClouderaConnectionData
import com.directv.hw.hadoop.cloudera.service.{ClouderaClient, ClouderaManagerServiceFactory}
import com.directv.hw.hadoop.routing.VersionParser
import com.directv.hw.persistence.entity.ApiEntity
import scaldi.{Injectable, Injector}

class ClouderaVersionRouterImpl(versions: Map[String, String])(implicit injector: Injector)
  extends ClouderaVersionRouter with Injectable with VersionParser{

  private val pluginManager = inject[DapPluginManager]
  private val appConf = inject[AppConf]

  override def findClient(version: String, api: ApiEntity): ClouderaClient = {

    val pluginId = versions.getOrElse(majorVersion(version),
      throw new CalleeException(s"Could not find service plugin for CDH$version"))

    val serviceFactory = pluginManager.getExtension(pluginId, classOf[ClouderaManagerServiceFactory])

    val tlsEnabled = api.protocol match {
      case p if p.equalsIgnoreCase(AccessProtocol.http) => false
      case p if p.equalsIgnoreCase(AccessProtocol.https) => true
      case _ => throw new CalleeException(s"Unknown protocol for CM API - ${api.protocol}")
    }

    serviceFactory.getClouderaClient {
      ClouderaConnectionData (
        api.host,
        api.port,
        tlsEnabled,
        api.user.get,
        api.password.get,
        appConf.outgoingHttpConnectTimeoutMs,
        appConf.outgoingHttpRqTimeoutMs
      )
    }
  }
}
