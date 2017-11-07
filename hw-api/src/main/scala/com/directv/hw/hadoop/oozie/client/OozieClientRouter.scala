package com.directv.hw.hadoop.oozie.client

import com.directv.hw.hadoop.model.ClusterPath

trait OozieClientRouter {
  def getOozieClient(clusterPath: ClusterPath, team: Option[String] = None): OozieClient
}
