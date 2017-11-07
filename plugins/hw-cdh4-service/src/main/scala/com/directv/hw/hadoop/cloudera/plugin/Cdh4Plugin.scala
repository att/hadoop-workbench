package com.directv.hw.hadoop.cloudera.plugin

import java.util.concurrent.TimeUnit

import com.cloudera.api.ClouderaManagerClientBuilder
import com.directv.hw.hadoop.cloudera.ClouderaConnectionData
import com.directv.hw.hadoop.cloudera.service.{ClouderaClient, ClouderaManagerServiceFactory, ClouderaV3Client}
import ro.fortsoft.pf4j.{Extension, Plugin, PluginWrapper}

class Cdh4HadoopPluginWrapper(pluginWrapper: PluginWrapper) extends Plugin(pluginWrapper)

@Extension
class Cdh4ServiceFactoryImpl extends ClouderaManagerServiceFactory {

  override def getClouderaClient(connectionData: ClouderaConnectionData): ClouderaClient = {

    val root = new ClouderaManagerClientBuilder()
      .withHost(connectionData.host)
      .withUsernamePassword(connectionData.userName, connectionData.password)
      .withPort(connectionData.port)
      .enableLogging()
      .withConnectionTimeout(connectionData.connetionTimeoutMs, TimeUnit.MILLISECONDS)
      .withReceiveTimeout(connectionData.receivingTimeoutMs, TimeUnit.MILLISECONDS)

    if (connectionData.tlsEnabled) {
      root.enableTLS().disableTlsCertValidation().disableTlsCnValidation()
    }

    new ClouderaV3Client(root.build().getRootV3)
  }
}
