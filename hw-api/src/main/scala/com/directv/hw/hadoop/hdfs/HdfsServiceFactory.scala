package com.directv.hw.hadoop.hdfs

import com.directv.hw.hadoop.model.ClusterPath

trait HdfsServiceFactory {
  def byTeam(clusterPath: ClusterPath, team: String): HdfsService
  def byUserId(clusterPath: ClusterPath, id: Option[Int], user: String): HdfsService
}