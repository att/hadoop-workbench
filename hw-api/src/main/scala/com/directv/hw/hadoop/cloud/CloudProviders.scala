package com.directv.hw.hadoop.cloud

import com.directv.hw.util.ParameterEnumeration

object CloudProviders extends ParameterEnumeration {
  val Amazon = Value("AWS")
  val Kubernetes = Value("K8S")
  val OnPremise = Value("on-premise")
}

