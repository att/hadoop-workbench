package com.directv.hw.hadoop.config

object ClusterServiceNames extends Enumeration {
  type ClusterServiceName = Value

  val oozie = Value("OOZIE")
  val nameNode = Value("NAMENODE")
  val resourceManager = Value("RESOURCEMANAGER")
  val jobHistory = Value("JOBHISTORY")
  val zookeeper = Value("ZOOKEEPER")
}
