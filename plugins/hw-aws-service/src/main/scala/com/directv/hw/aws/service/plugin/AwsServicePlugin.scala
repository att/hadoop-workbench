package com.directv.hw.aws.service.plugin

import com.directv.hw.hadoop.aws.{AwsClient, AwsClientFactory}
import ro.fortsoft.pf4j.{Extension, ExtensionPoint, Plugin, PluginWrapper}

class AwsServicePlugin(pluginWrapper: PluginWrapper) extends Plugin(pluginWrapper)

@Extension
class AwsClientFactoryImpl extends ExtensionPoint with AwsClientFactory {

  override def getAwsClient(accessKey: String, secretKey: String, region: String): AwsClient = {
    new AwsClientImpl(accessKey, secretKey, region)
  }
}
