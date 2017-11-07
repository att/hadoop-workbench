package com.directv.hw.hadoop.platform

import com.directv.hw.util.ParameterEnumeration

object PlatformTypes extends ParameterEnumeration {
  val CDH = Value("CDH")
  val HDP = Value("HDP")
  val Kafka = Value("KAFKA")
  val Cassandra = Value("CASSANDRA")
}
