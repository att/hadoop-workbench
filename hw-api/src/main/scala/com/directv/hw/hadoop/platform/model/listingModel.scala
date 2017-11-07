package com.directv.hw.hadoop.platform.model

import com.directv.hw.core.service.HadoopServiceTypes
import com.directv.hw.hadoop.model.OoziePath

case class ServiceType(id: String, title: String, versions: Option[List[String]])

case class PlatformInfo(id: Int, title: String, host: String, `type`: String)

case class ClusterInfo(id: String, title: String, kerberized: Option[Boolean] = None, realm: Option[String] = None)

case class ServiceHost(host: String, port: Int)

case class ServiceInfo(id: String, title: String, `type`: String) // TODO: vvozdroganov - make enum

object HdfsServiceInfo extends ServiceInfo(OoziePath.HDFS_SERVICE_ID, OoziePath.HDFS_SERVICE_ID, HadoopServiceTypes.hdfs)

case class BasicOozieServiceInfo(serviceId: Option[String], host: Option[String], port: Option[Int], protocol: Option[String], rootPath: Option[String])

// TODO: vvozdroganov: implement proper hierarchy
sealed abstract class FullModuleInfo {
  def platform: PlatformInfo
  def cluster: ClusterInfo
  def service: ServiceInfo
  def id: String
  def `type`: String
}

case class FullAgentInfo(id: String,
                         title: String,
                         agentName: String,
                         isBase: Boolean,
                         platform: PlatformInfo,
                         cluster: ClusterInfo,
                         service: ServiceInfo,
                         `type`: String = HadoopServiceTypes.flume) extends FullModuleInfo()

case class FullWorkflowInfo(path: String,
                            title: String,
                            renderedName: String,
                            version: String,
                            platform: PlatformInfo,
                            cluster: ClusterInfo,
                            service: ServiceInfo = HdfsServiceInfo,
                            `type`: String = HadoopServiceTypes.oozie) extends FullModuleInfo() {

  override def id = path
}

