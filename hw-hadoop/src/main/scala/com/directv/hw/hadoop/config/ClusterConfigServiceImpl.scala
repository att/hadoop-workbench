package com.directv.hw.hadoop.config

import java.nio.file.{Files, Paths}

import com.directv.hw.core.service.HadoopConfigNames.HadoopConfigName
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.hadoop.platform.service.PlatformClient
import com.directv.hw.persistence.dao.{ClusterConfigUpdateDao, ClusterDao, ClusterServiceDao, PlatformDao}
import com.directv.hw.persistence.entity.{ClusterConfigUpdateEntity, ClusterServiceEntity}
import com.typesafe.scalalogging.LazyLogging
import org.apache.commons.io.FileUtils
import scaldi.{Injectable, Injector}

class ClusterConfigServiceImpl(repositoryPath: String,
                               clientRouters: Map[String, ((Int) => PlatformClient)])(implicit injector: Injector)
  extends ClusterConfigService with Injectable with LazyLogging{

  private val configsPath = Paths.get(repositoryPath).resolve("configs")
  private val platformDao = inject[PlatformDao]
  private val clusterDao = inject[ClusterDao]
  private val updateStatusDao = inject[ClusterConfigUpdateDao]

  override def pullConfigFiles(clusterPath: ClusterPath): Unit = {
    pullFromCluster(clusterPath)
  }

  private def pullFromCluster(clusterPath: ClusterPath) = {
    try {
      val clusterConfDir = configsPath.resolve(clusterPath.platformId.toString).resolve(clusterPath.clusterId)
      if (Files.exists(clusterConfDir)) FileUtils.forceDelete(clusterConfDir.toFile)
      platformClient(clusterPath.platformId).retrieveClientConfigs(clusterPath.clusterId).foreach { case (name, value) =>
        Files.createDirectories(clusterConfDir)
        FileUtils.writeStringToFile(clusterConfDir.resolve(name).toFile, value)
      }

      saveStatus(clusterPath, success = true)
    } catch {
      case e: Exception =>
        saveStatus(clusterPath, success = false)
        throw e
    }
  }

  private def saveStatus(clusterPath: ClusterPath, success: Boolean) = {
    updateStatusDao.save(ClusterConfigUpdateEntity(clusterPath.platformId, clusterPath.clusterId, success))
  }

  override def pullConfigsQuietly(platformId: Int): Unit = {
    val clusters = clusterDao.findByPlatform(platformId).map(cluster => new ClusterPath(platformId, cluster.clusterId))
    updateClustersQuietly(clusters)
  }

  override def pullConfigsQuietly(): Unit = {
    val clusters = clusterDao.getAll.map(cluster => new ClusterPath(cluster.platformId, cluster.clusterId))
    updateClustersQuietly(clusters)
  }

  override def deleteConfigs(platformId: Int): Unit = {
    val platformDir = configsPath.resolve(platformId.toString)
    if (platformDir.toFile.exists()) {
      FileUtils.forceDelete(platformDir.toFile)
    }
  }

  private def updateClustersQuietly(clusters: List[ClusterPath]) = {
    clusters.foreach { clusterPath =>
      try {
        pullFromCluster(clusterPath)
      } catch {
        case e: Exception => logger.error("could not pull config files from cluster", e)
      }
    }
  }

  private def platformClient(platformId: Int): PlatformClient = {
    val (platform, _) = platformDao.findPlatformById(platformId)
    clientRouters(platform.`type`)(platformId)
  }

  override def getConfig(clusterPath: ClusterPath, name: HadoopConfigName): Option[String] = {
    val clusterConfigPath = configsPath.resolve(clusterPath.platformId.toString).resolve(clusterPath.clusterId)
    val filePath = clusterConfigPath.resolve(name.toString)
    if (Files.exists(filePath)) {
      Some(FileUtils.readFileToString(filePath.toFile))
    } else {
      None
    }
  }
}
