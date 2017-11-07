package com.directv.hw.hadoop.deployment

import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.hadoop.oozie.model.DeploymentResult
import com.directv.hw.hadoop.oozie.service.OozieService
import scaldi.{Injectable, Injector}

class DeploymentServiceImpl(implicit injector: Injector) extends DeploymentService with Injectable {

  private val oozieService = inject[OozieService]

  override def deploy(compnentId: Int, clusterPath: ClusterPath, env: String, user: String): DeploymentResult = {
    oozieService.deployByEnv(compnentId, clusterPath, env, user)
  }
}
