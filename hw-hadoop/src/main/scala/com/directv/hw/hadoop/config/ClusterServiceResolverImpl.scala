package com.directv.hw.hadoop.config

import com.directv.hw.core.exception.ConfigurationException
import com.directv.hw.core.service.HadoopConfigNames
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.persistence.dao.{ClusterDao, ClusterServiceDao}
import com.directv.hw.persistence.entity.ClusterServiceEntity
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}

class ClusterServiceResolverImpl(implicit injector: Injector) extends ClusterServiceResolver with Injectable
  with LazyLogging{

  private val configConverter = inject[ConfigConverter]
  private val configRepo = inject[ClusterConfigService]
  private val clusterServiceDao = inject[ClusterServiceDao]
  private val clusterDao = inject[ClusterDao]

  override def resolveNamenodes(clusterPath: ClusterPath): List[String] = {
    extractNamenodes(clusterPath)
  }

  override def resolveResourceManagers(clusterPath: ClusterPath): List[String] = {
    extractResourceManager(clusterPath)
  }

  private def extractNamenodes(clusterPath: ClusterPath): List[String] = {
    val hdfsProps = getSiteProperties(clusterPath, HadoopConfigNames.HdfsSite)
    val namenodeProps = hdfsProps.filter(_.key.startsWith("dfs.namenode.http-address"))
    val services = hdfsProps.find(_.key == "dfs.internal.nameservices")
      .map(_.value.split(",").toList)
      .getOrElse(List.empty)

    logger.debug(s"Resolved HDFS nameservices for cluster $clusterPath: ${services.mkString(",")}")
    val internalNamenodeProps = if (services.nonEmpty) {
      namenodeProps.filter(node => services.exists(node.key.contains(_)))
    } else {
      namenodeProps
    }

    val namenodes = internalNamenodeProps.map("http://" + _.value)
    logger.debug(s"Resolved namenodes for cluster $clusterPath: " + namenodes.mkString(","))
    namenodes
  }

  override def updateSeviceCacheQuietly(): Unit = {
    clusterServiceDao.deleteAll()
    clusterDao.getAll.foreach { cluster =>
      val clusterPath = new ClusterPath(cluster.platformId, cluster.clusterId)
      try {
        configRepo.pullConfigFiles(clusterPath)
        updateSeviceCache(clusterPath)
      } catch {
        case e: Exception =>
          logger.error("couldn't not update cluster service cache", e)
      }
    }
  }

  private def updateSeviceCache(clusterPath: ClusterPath): Unit = {
    clusterServiceDao.delete(clusterPath)
    val namenodes = extractNamenodes(clusterPath)
    if (namenodes.nonEmpty) {
      clusterServiceDao.saveService {
        ClusterServiceEntity (
          clusterPath.platformId,
          clusterPath.clusterId,
          ClusterServiceNames.nameNode,
          namenodes.head
        )
      }
    }

    extractOozie(clusterPath).foreach { url =>
      clusterServiceDao.saveService {
        ClusterServiceEntity (
          clusterPath.platformId,
          clusterPath.clusterId,
          ClusterServiceNames.oozie,
          url
        )
      }
    }

    val resourceManagers = extractResourceManager(clusterPath)
    if (resourceManagers.nonEmpty) {
      clusterServiceDao.saveService {
        ClusterServiceEntity (
          clusterPath.platformId,
          clusterPath.clusterId,
          ClusterServiceNames.resourceManager,
          resourceManagers.head
        )
      }
    }

    extractJobHistory(clusterPath).foreach { url =>
      clusterServiceDao.saveService {
        ClusterServiceEntity (
          clusterPath.platformId,
          clusterPath.clusterId,
          ClusterServiceNames.jobHistory,
          url
        )
      }
    }
  }

  private def extractOozie(clusterPath: ClusterPath) = {
    val properties = getSiteProperties(clusterPath, HadoopConfigNames.OozieSite)
    properties.find(_.key == "oozie.base.url").map(_.value)
  }

  private def extractResourceManager(clusterPath: ClusterPath): List[String] = {
    val properties = getSiteProperties(clusterPath, HadoopConfigNames.YarnSite)
    val resourceManagerPropsHA = properties.filter(_.key.startsWith("yarn.resourcemanager.webapp.address.rm"))
    if (resourceManagerPropsHA.isEmpty) {
      properties.find(_.key == "yarn.resourcemanager.webapp.address").map("http://" + _.value).get :: Nil
    } else {
      resourceManagerPropsHA.map("http://" + _.value)
    }
  }

  private def extractJobHistory(clusterPath: ClusterPath): Option[String] = {
    val properties = getSiteProperties(clusterPath, HadoopConfigNames.MapRedSite)
    properties.find(_.key == "mapreduce.jobhistory.webapp.address").map("http://" + _.value)
  }

  private def getSiteProperties(clusterPath: ClusterPath, configName: HadoopConfigNames.Value) = {
    configRepo.getConfig(clusterPath, configName)
      .map(configConverter.toConfig).getOrElse {
      throw ConfigurationException(s"$configName not found")
    }
  }

  override def pullAndResolve(clusterPath: ClusterPath): Unit = {
    configRepo.pullConfigFiles(clusterPath)
    updateSeviceCache(clusterPath)
  }
}