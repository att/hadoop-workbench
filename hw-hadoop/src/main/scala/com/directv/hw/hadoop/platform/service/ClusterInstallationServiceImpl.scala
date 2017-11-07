package com.directv.hw.hadoop.platform.service

import com.directv.hw.core.exception.NotSupportedException
import com.directv.hw.hadoop.platform.PlatformTypes
import com.directv.hw.hadoop.platform.model.ClusterInstallation
import scaldi.{Injectable, Injector}


class ClusterInstallationServiceImpl(implicit injector: Injector) extends ClusterInstallationService with Injectable {

  private val hadoopInstallator = new HaddopClusterInstallator
  private val oneServiceInstallator = new OneServiceInstallator
  private val platformManager = inject[PlatformManager]

  override def addCluster(cluster: ClusterInstallation, user: String): Unit = {
    installator(cluster.distType).addCluster(cluster, user)
  }

  private def installator(platformType: PlatformTypes.Value): ClusterInstallator = {
    platformType match {
      case PlatformTypes.HDP => hadoopInstallator
      case PlatformTypes.Kafka => oneServiceInstallator
      case PlatformTypes.Cassandra => oneServiceInstallator
      case unsupported => throw new NotSupportedException("platform type is not supported: " + unsupported)
    }
  }

  override def delete(installationId: String, user: String): Unit = {
    platformManager.deletePlatformByInstallationId(installationId)
  }
}