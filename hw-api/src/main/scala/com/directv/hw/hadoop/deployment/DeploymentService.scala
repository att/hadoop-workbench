package com.directv.hw.hadoop.deployment

import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.hadoop.oozie.model.DeploymentResult

trait DeploymentService {
  def deploy(compnentId: Int, clusterPath: ClusterPath, env: String, user: String): DeploymentResult
}
