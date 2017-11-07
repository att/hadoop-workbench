package com.directv.hw.hadoop.flume.model

import com.directv.hw.hadoop.host.model.PlatformHost
import com.directv.hw.hadoop.model.{InstanceHealth, InstanceState}

case class AgentInstance (id: String, host: PlatformHost, state: InstanceState, health: InstanceHealth, isStale: Boolean, config: FlumeComponentConfig)

case class AgentInstancesData(instances: List[AgentInstance], availableHosts: List[PlatformHost])


