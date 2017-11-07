package com.directv.hw.hadoop.platform.service

import com.directv.hw.hadoop.platform.PlatformTypes
import com.directv.hw.hadoop.platform.model.ClusterInstallation

trait ClusterInstallationService {
  def addCluster(cluster: ClusterInstallation, user: String): Unit
  def delete(installationId: String, user: String): Unit
}
