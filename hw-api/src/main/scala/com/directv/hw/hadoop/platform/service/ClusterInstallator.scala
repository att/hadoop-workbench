package com.directv.hw.hadoop.platform.service

import com.directv.hw.hadoop.platform.model.ClusterInstallation

trait ClusterInstallator {
  def addCluster(cluster: ClusterInstallation, user: String): Unit
}
