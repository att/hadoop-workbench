package com.directv.hw.hadoop.aws

import ro.fortsoft.pf4j.ExtensionPoint

trait AwsClientFactory extends ExtensionPoint {
  def getAwsClient(accessKey: String, secretKey: String, region: String): AwsClient
}
