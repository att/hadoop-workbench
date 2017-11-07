package com.directv.hw.hadoop.cloud

import com.directv.hw.util.ParameterEnumeration

object AwsRegions extends ParameterEnumeration {
  val usEast1 = Value("us-east-1")
  val usWest1 = Value("us-west-1")
  val usWest2 = Value("us-west-2")
  val euWest1 = Value("eu-west-1")
  val euCentral1 = Value("eu-central-1")
  val apSoutheast1 = Value("ap-southeast-1")
  val apNortheast1 = Value("ap-northeast-1")
  val apSoutheast2 = Value("ap-southeast-2")
  val apNortheast2 = Value("ap-northeast-2")
  val apSouth1 = Value("ap-south-1")
  val saEast1 = Value("sa-east-1")
}
