package com.directv.hw.hadoop.aws

trait AwsClientRouter {
  def getAwsClient: AwsClient
}
