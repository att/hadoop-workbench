package com.directv.hw.hadoop.config

import com.directv.hw.hadoop.model.ClusterPath

trait ClusterServiceResolver {
  def resolveNamenodes(clusterPath: ClusterPath): List[String]
  def resolveResourceManagers(clusterPath: ClusterPath): List[String]
  def updateSeviceCacheQuietly(): Unit
  def pullAndResolve(clusterPath: ClusterPath): Unit
}
