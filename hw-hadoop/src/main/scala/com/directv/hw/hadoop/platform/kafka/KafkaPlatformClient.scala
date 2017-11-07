package com.directv.hw.hadoop.platform.kafka

import com.directv.hw.hadoop.host.model.PlatformHost
import com.directv.hw.hadoop.oozie.model.OozieAccessInfo
import com.directv.hw.hadoop.platform.model.{ClusterInfo, ServiceHost, ServiceInfo}
import com.directv.hw.hadoop.platform.service.PlatformClient
import com.directv.hw.persistence.dao.ClusterDao
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}

class KafkaPlatformClient(platformId: Int)(implicit injector: Injector) extends PlatformClient with LazyLogging with Injectable {

  val clusterDao = inject[ClusterDao]

  override def getHosts(clusterId: String): List[PlatformHost] = List.empty

  override def getServices(clusterId: String): List[ServiceInfo] = List.empty

  override def retrieveClientConfigs(clusterId: String): Map[String, String] = Map.empty

  override def getClusters: List[ClusterInfo] = {
    clusterDao.findByPlatform(platformId).map(entity => ClusterInfo(entity.clusterId, entity.name))
  }

  override def getActiveZooKeeper(clusterId: String): Option[ServiceHost] = None
}
