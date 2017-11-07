package com.directv.hw.core.service

import com.directv.hw.hadoop.platform.model.ServiceType
import com.directv.hw.util.ParameterEnumeration

object HadoopServiceTypes {
  val flume = "FLUME"
  val oozie = "OOZIE"
  val oozieRuntime = "OOZIE_RUNTIME"
  val hdfs = "HDFS"
}

object HadoopConfigNames extends ParameterEnumeration {
  type HadoopConfigName = Value

  val CoreSite = Value("core-site.xml")
  val HdfsSite = Value("hdfs-site.xml")
  val HbaseSite = Value("hbase-site.xml")
  val HiveSite = Value("hive-site.xml")
  val YarnSite = Value("yarn-site.xml")
  val MapRedSite = Value("mapred-site.xml")
  val OozieSite = Value("oozie-site.xml")
}

trait HadoopServiceRegistry {
  def registerType(`type`: String, versions: Option[List[String]] = None): Unit
  def getRegisteredTypes: List[ServiceType]
}
