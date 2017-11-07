package com.directv.hw.web.platform.model

import com.directv.hw.util.ParameterEnumeration

sealed abstract class PlatformStatusMessage

object PlatformStatuses extends ParameterEnumeration {
  val online = Value("online")
  val offline = Value("offline")
  val unknown = Value("unknown")
  val destroyed = Value("destroyed")
  val deleted = Value("deleted")
  val error = Value("error")
}

case class PlatformListResp(platforms: List[Int], `type`: String = "platform_list") extends PlatformStatusMessage

case class PlatformStatusResp(id: Int,
                              status: PlatformStatuses.Value,
                              message: Option[String] = None,
                              `type`: String = "status") extends PlatformStatusMessage



object PlatformProperties extends ParameterEnumeration {
  val host = Value("host")
}

case class PropertyPair(name: PlatformProperties.Value, value: String)

case class PlatformUpdateResp(id: Int,
                              properties: List[PropertyPair],
                              `type`: String = "properties_update") extends PlatformStatusMessage


object PlatformProcessStatuses extends ParameterEnumeration {
  val provisioning = Value("provisioning")
  val destroying = Value("destroying")
}

case class PlatformProcessResp(id: Int,
                               status: PlatformProcessStatuses.Value,
                               progress: Int,
                               message: Option[String] = None,
                               `type`: String = "process") extends PlatformStatusMessage


case class IndexationStatus(indexing: Boolean, progress: Option[Boolean] = None, lastUpdate: Option[Long] = None)

case class ClusterStatusResp(platformId: Int,
                             clusterId: String,
                             oozieWorkflow: IndexationStatus,
                             oozieJob: IndexationStatus,
                             `type`: String = "cluster_status") extends PlatformStatusMessage
