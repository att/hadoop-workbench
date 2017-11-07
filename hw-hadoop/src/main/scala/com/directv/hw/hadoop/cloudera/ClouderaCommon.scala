package com.directv.hw.hadoop.cloudera

import com.directv.hw.hadoop.cloudera.model.{ClouderaCluster, ClouderaHost}
import com.directv.hw.hadoop.host.model.PlatformHost
import com.directv.hw.hadoop.platform.model.ClusterInfo

object ClouderaCommon {

  val keyAgentName = "agent_name"
  val keyConfigFile = "agent_config_file"
  val keyPluginDirs = "agent_plugin_dirs"


  def toClusterInfo(cluster: ClouderaCluster): ClusterInfo = {
    ClusterInfo(cluster.id, notNull(cluster.title, cluster.id))
  }

  def toPlatformHost(host: ClouderaHost): PlatformHost = {
    PlatformHost(host.hostId, host.ipAddress, host.hostname)
  }

  private def notNull(s: String, replacement: String): String = {
    if (s != null) {
      s
    } else {
      replacement
    }
  }
}
