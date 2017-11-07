package com.directv.hw.hadoop.oozie.model

import com.directv.hw.hadoop.model.ClusterPath

object OozieIndexation {
  case class IndexAllHds(user: String)
  case class StartIndexation(clusterPath: ClusterPath, path: String, user: String)
  case class StopIndexation(clusterPath: ClusterPath)
  case class IndexationCompleted(key: String)
  case class GetStatus(clusterPath: ClusterPath)
  
  abstract sealed class Status(val value: String) {
    override def toString: String = value
  }

  case object Running extends Status("running")
  case object NotRunning extends Status("notRunning")
}
