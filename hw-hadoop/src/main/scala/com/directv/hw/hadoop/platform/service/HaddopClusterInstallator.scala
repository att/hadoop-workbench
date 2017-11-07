package com.directv.hw.hadoop.platform.service

import akka.actor.ActorRef
import com.directv.hw.core.access.SrvUser
import com.directv.hw.hadoop.di.DiReferences
import com.directv.hw.hadoop.flume.cache.{FlumeUpdateActor, FlumeUpdateActorHolder}
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.hadoop.oozie.model.OozieIndexation
import com.directv.hw.persistence.dao._
import com.directv.hw.persistence.entity._
import com.typesafe.scalalogging.LazyLogging
import scaldi.Injector

class HaddopClusterInstallator(implicit injector: Injector) extends ClusterInstallatorBase with LazyLogging {

  private val platformAccessDao = inject[PlatformAccessDao]
  private val userDao = inject[ServiceUserDao]
  private val hdfsAccessDao = inject[HdfsAccessDao]
  private val oozieAccessDao = inject[OozieAccessDao]
  private val oozieIndexer = inject[ActorRef](DiReferences.oozieIndexer)
  private val flumeUdateActor = inject[FlumeUpdateActorHolder].actor

  override protected def configureServices(platformId: Int, clusterId: String, user: String): Unit = {

    logger.debug(s"configuring services for HDP cluster: $clusterId, platfromId: $platformId")

    val platformAcces = PlatformAccessEntity (
      id = Some(platformId),
      userName = Some("hwadmin"),
      password = Some("hwadmin"),
      pluginDirs = Some("/usr/hdp/current/flume-server/plugins.d")
    )

    platformAccessDao.savePlatformAccess(platformAcces)

    val clusterPath = new ClusterPath(platformId, clusterId)
    def getHdfsUser = userDao.users().find(_.name == "hdfs").flatMap(_.id)
    val hdfsUserId = getHdfsUser.orElse {
      try {
        Some(userDao.addUser(SrvUser(None, "hdfs")))
      } catch {
        case e: Exception =>
          logger.warn("can not add 'hdfs' user", e)
          getHdfsUser
      }

    }

    hdfsAccessDao.save (
      HdfsAccessEntity (
        clusterPath.platformId,
        clusterPath.clusterId,
        hdfsUserId
      )
    )

    def getOozieUser = userDao.users().find(_.name == "oozie").flatMap(_.id)
    val oozieUserId = getOozieUser.orElse {
      try {
        Some(userDao.addUser(SrvUser(None, "oozie")))
      } catch {
        case e: Exception =>
          logger.warn("can not add 'oozie' user", e)
          getOozieUser
      }

    }

    oozieAccessDao.save (
      OozieAccessEntity (
        clusterPath.platformId,
        clusterPath.clusterId,
        oozieUserId
      )
    )

    oozieIndexer ! OozieIndexation.StartIndexation(clusterPath, "/", user)
    flumeUdateActor ! FlumeUpdateActor.UpdateCluster(clusterPath)
  }
}
