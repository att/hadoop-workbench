package com.directv.hw.hadoop.oozie.model

import akka.actor.ActorRef
import com.directv.hw.hadoop.model.ClusterPath

object OozieJobCache {
  case class GetStatus(clusterPath: ClusterPath)
  case class StartUpdate(clusterPath: ClusterPath)
  case class FinishUpdate(clusterPath: ClusterPath)
  case object FinishAcknowledge
}

