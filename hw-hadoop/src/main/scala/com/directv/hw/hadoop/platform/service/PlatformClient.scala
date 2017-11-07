package com.directv.hw.hadoop.platform.service

import com.directv.hw.hadoop.host.model.PlatformHost
import com.directv.hw.hadoop.oozie.model.OozieAccessInfo
import com.directv.hw.hadoop.platform.model._

trait PlatformClient {
  def getHosts(clusterId: String): List[PlatformHost]
  def getClusters: List[ClusterInfo]
  def getServices(clusterId: String): List[ServiceInfo]
  def getActiveZooKeeper(clusterId: String): Option[ServiceHost]
  def retrieveClientConfigs(clusterId: String): Map[String, String]
}