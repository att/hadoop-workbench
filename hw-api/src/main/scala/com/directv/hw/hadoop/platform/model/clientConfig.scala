package com.directv.hw.hadoop.platform.model

import com.directv.hw.hadoop.model.ClusterPath

object ClientConfigs {
  val actorId = "clientConfigUpdater"
}

case object FullUpdateClientConfigs
case class UpdateClientConfigs(platformId: Int)
case class ForgetClientConfigs(platformId: Int)

case class ClientConfigRequest(clusterPath: ClusterPath, fileName: String)
case class ClientConfigResponse(xml: Option[String])
