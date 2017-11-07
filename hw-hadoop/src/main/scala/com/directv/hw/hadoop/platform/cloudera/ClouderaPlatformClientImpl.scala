package com.directv.hw.hadoop.platform.cloudera

import com.directv.hw.common.io.PackUtils
import com.directv.hw.core.service.{HadoopConfigNames, HadoopServiceTypes}
import com.directv.hw.hadoop.cloudera.ClouderaCommon._
import com.directv.hw.hadoop.cloudera.routing.ClouderaVersionRouter
import com.directv.hw.hadoop.cloudera.service.ClouderaClient
import com.directv.hw.hadoop.config.{ConfigConverter, ConfigEntry}
import com.directv.hw.hadoop.di.PlatformModule.inject
import com.directv.hw.hadoop.host.model.PlatformHost
import com.directv.hw.hadoop.oozie.model.OozieAccessInfo
import com.directv.hw.hadoop.platform.model._
import com.directv.hw.hadoop.platform.service.PlatformClient
import com.directv.hw.persistence.dao.PlatformDao
import scaldi.{Injectable, Injector}

class ClouderaPlatformClientImpl(platformId: Int)(implicit injector: Injector) extends PlatformClient with Injectable {

  private val platformDao = inject[PlatformDao]
  private val configConverter = inject[ConfigConverter]
  private val versionRouter = inject[ClouderaVersionRouter]

  val (platform, api) = platformDao.findPlatformById(platformId)
  val clouderaClient = versionRouter.findClient(platform.version, api)

  override def getHosts(clusterId: String): List[PlatformHost] = {
    clouderaClient.getHosts(clusterId) map toPlatformHost
  }

  override def getClusters: List[ClusterInfo] = {
    clouderaClient.getClusters map toClusterInfo
  }

  override def getServices(clusterId: String): List[ServiceInfo] = {
    clouderaClient.getServices(clusterId).map { service =>
      ServiceInfo(service.id, service.title, toHadoopServiceType(service.`type`))
    }
  }

  private def toHadoopServiceType(clouderaType: String) = {
    clouderaType match {
      case ClouderaServiceType.flume => HadoopServiceTypes.flume
      case ClouderaServiceType.hdfs => HadoopServiceTypes.hdfs
      case ClouderaServiceType.oozie => HadoopServiceTypes.oozieRuntime
      case other => other
    }
  }

  override def retrieveClientConfigs(clusterId: String): Map[String, String] = {
    val filesToKeep = HadoopConfigNames.values.map(_.toString)
    val unpacked: List[(String, Array[Byte])] = clouderaClient.retrieveClientConfigs(clusterId) flatMap PackUtils.unpackZip

    val configs = unpacked.foldLeft(Map.empty[String, Map[String, ConfigEntry]]) { (configsByName, content) =>
      val (fileName, rawContent) = content
      val name = if(fileName.indexOf("/") >= 0) fileName.substring(fileName.lastIndexOf('/') + 1) else fileName
      if(filesToKeep contains name) {
        val entries = configConverter.toConfig(new String(rawContent))
        val existingEntries = configsByName.getOrElse(name, Map.empty)
        val mergedEntries = entries.foldLeft(existingEntries) { (map, entry) =>
          map + (entry.key -> entry)
        }

        configsByName + (name -> mergedEntries)
      } else {
        configsByName
      }
    }

    configs map { case (name, map) =>
      name -> configConverter.toConfigXml(map.values)
    }
  }

  override def getActiveZooKeeper(clusterId: String): Option[ServiceHost] = None
}