package com.directv.hw.hadoop.cloudera.model

case class ClouderaConfigItem(value: Option[String], default: Option[String] = None)

case class ClouderaRoleGroup(id: String, title: String, config: Map[String, ClouderaConfigItem], isBase: Boolean = false)

case class ClouderaServiceInfo(id: String, title: String, `type`: String)

case class ClouderaCluster(id: String, title: String)

sealed abstract class ClouderaHealth()
case object ClouderaHealthGood extends ClouderaHealth
case object ClouderaHealthBad extends ClouderaHealth
case object ClouderaHealthConcerning extends ClouderaHealth
case object ClouderaHealthUnknown extends ClouderaHealth

sealed abstract class ClouderaRoleState()
case object ClouderaInstanceStarted extends ClouderaRoleState
case object ClouderaInstanceStopped extends ClouderaRoleState
case object ClouderaInstanceBusy extends ClouderaRoleState
case object ClouderaInstanceUnknown extends ClouderaRoleState

case class ClouderaRole(id: String, roleType: String,
                        state: ClouderaRoleState, health: ClouderaHealth, isStale: Boolean,
                        hostId: String, config: Map[String, ClouderaConfigItem])

case class CommandResult(errors: List[String], isSuccess: Boolean, message: Option[String])

case class ClouderaHost(hostId: String, ipAddress: String, hostname: Option[String])

case class ClouderaServiceHost(host: String, port: String)

case class ClouderaHdfsHost(host: String, port: String, httpPort: String, serviceId: String)

case class ClouderaHiveMetastore(srv: ClouderaServiceHost, pricipal: String)

case class ClouderaZookeeperQuorum(hosts: List[ClouderaServiceHost])