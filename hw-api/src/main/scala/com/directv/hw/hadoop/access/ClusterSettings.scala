package com.directv.hw.hadoop.access

case class ClusterSettings(kerberized: Boolean, realm: Option[String])

case class CustomClusterProperty(key: String, value: String, description: Option[String])
