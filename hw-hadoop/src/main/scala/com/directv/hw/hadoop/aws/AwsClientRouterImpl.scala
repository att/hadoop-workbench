package com.directv.hw.hadoop.aws

import com.directv.hw.core.plugin.DapPluginManager
import com.directv.hw.core.service.AppConf
import scaldi.{Injectable, Injector}

class AwsClientRouterImpl(pluginId: String)(implicit injector: Injector) extends AwsClientRouter with Injectable {

  private val pluginManager = inject[DapPluginManager]
  private val factory = pluginManager.getExtension(pluginId, classOf[AwsClientFactory])
  private val appConf = inject[AppConf]

  override def getAwsClient: AwsClient = {
    factory.getAwsClient(appConf.awsAccessKey, appConf.awsSecretKey, appConf.awsRegion)
  }
}
