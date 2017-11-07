package com.directv.hw.hadoop.platform.hortonworks

import com.directv.hw.common.io.PackUtils
import com.directv.hw.core.service.{AppConf, HadoopConfigNames, HadoopServiceTypes}
import com.directv.hw.hadoop.config.{ConfigConverter, ConfigEntry}
import com.directv.hw.hadoop.hortonworks.client._
import com.directv.hw.hadoop.host.model.PlatformHost
import com.directv.hw.hadoop.platform.model.{ClusterInfo, _}
import com.directv.hw.hadoop.platform.service.PlatformClient
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}

import scala.concurrent.{Await, ExecutionContext, Future}
import scala.concurrent.duration._
import scala.language.postfixOps
import HortonWorksPlatformClientImpl._
import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.persistence.dao.PlatformDao

object HortonWorksPlatformClientImpl {
  val namenode_http_address = "dfs.namenode.http-address"
  val dfs_namenode_rpc_address = "dfs.namenode.rpc-address"
  val yarn_resourcemanager_address = "yarn.resourcemanager.address"
  val yarn_web_address = "yarn.resourcemanager.webapp.address"
  val job_history_web_address = "mapreduce.jobhistory.webapp.address"
  val oozie_base_url = "oozie.base.url"
  val HDFS_service = "HDFS"
  val zookeeper_service = "ZOOKEEPER"
  val YARN_service = "YARN"
  val HBASE_service = "HBASE"
  val mapreduce2_service = "MAPREDUCE2"
  val HIVE_service = "HIVE"
  val OOZIE_service = "OOZIE"
  val FLUME_service = "FLUME"
  val FLUME_component = "FLUME_HANDLER"
  val NAME_NODE_component = "NAMENODE"
  val zookeeper_srv_comp = "ZOOKEEPER_SERVER"
  val YARN_component = "RESOURCEMANAGER"
  val job_history_comp = "HISTORYSERVER"
  val HortonWorksServiceStarted = "STARTED"
  val HortonWorksStateInstalled = "INSTALLED"
  val HortonWorksStateUnknown = "UNKNOWN"
  val HortonWorksComponentStarted = "STARTED"

  def getPropertyValue(hortonWorksServiceConfig: ClusterConfigurations, property_name: String): Option[String] = {
    val property = hortonWorksServiceConfig.items.flatMap(_.configurations).flatMap(_.properties).find(_._1 == property_name)
    property map { case (_, value) => value }
  }
}

class HortonWorksPlatformClientImpl(platformId: Int)(implicit injector: Injector)
  extends PlatformClient with LazyLogging with Injectable {

  private val platformDao = inject[PlatformDao]
  private val hdpClient = inject[HortonWorksClient]
  private val appConf = inject[AppConf]
  private val configConverter = inject[ConfigConverter]

  private val (_, api) = platformDao.findPlatformById(platformId)
  implicit val conn = ConnectionInfo (
    s"${api.protocol}://${api.host}:${api.port}",
    api.user.getOrElse(""),
    api.password.getOrElse("")
  )

  private implicit val executionContext: ExecutionContext = inject[DispatcherFactory].dispatcher

  override def getHosts(clusterId: String): List[PlatformHost] = {
    await(hdpClient.getHosts(clusterId, conn))
      .items.map(p => PlatformHost(p.Hosts.host_name, p.Hosts.ip, Option(p.Hosts.host_name)))
  }

  override def getClusters: List[ClusterInfo] = {
    await(hdpClient.getClusters(conn))
      .items.map(cluster => ClusterInfo(cluster.Clusters.cluster_name, cluster.Clusters.cluster_name))
  }

  override def getActiveZooKeeper(clusterId: String): Option[ServiceHost] = {
    val activeHost = hdpClient.getComponentHosts(clusterId, zookeeper_service, zookeeper_srv_comp).map(_.headOption)
    val port = componentProperty(clusterId, zookeeper_srv_comp, "zoo.cfg", "clientPort", activeHost)
    await(activeHost).flatMap { host =>
      port.map(portValue => ServiceHost(host.host_name, portValue.toInt))
    }
  }

  private def parseHost(value: String): ServiceHost = {
      val parts = value.split(":")
      ServiceHost(parts(0), parts(1).toInt)
  }

  private def componentProperty(clusterId: String,
                                componentType: String,
                                config: String,
                                addressProperty: String,
                                activeHost: Future[Option[HostComponent]]): Option[String] = {



    val serviceHost = activeHost.flatMap {
      case Some(h) =>
        hdpClient.getHostComponentConfigs(clusterId, h.host_name, componentType).flatMap { configs =>
          val siteConfigVersion = configs(config)

          def defaultHttpHost = {
            hdpClient.getServiceConfiguration(clusterId, config, siteConfigVersion.default).map { config =>
              config.properties.find { entry =>
                entry._1.startsWith(addressProperty) && entry._2.startsWith(h.host_name)
              }.map(_._2)
            }
          }

          siteConfigVersion.overrides match {
            case Some(overrides) =>
              hdpClient.getServiceConfiguration(clusterId, config, overrides.head._2).flatMap { config =>
                config.properties.get(addressProperty) match {
                  case Some(hostValue) => Future(Some(hostValue))
                  case None => defaultHttpHost
                }
              }

            case None => defaultHttpHost
          }
        }

      case None => Future(None)
    }

    await(serviceHost)
  }

  override def getServices(clusterId: String): List[com.directv.hw.hadoop.platform.model.ServiceInfo] = {
    await(hdpClient.getServices(clusterId, conn)).items.map { service =>
      val info = service.ServiceInfo
      com.directv.hw.hadoop.platform.model.ServiceInfo (
        info.service_name,
        info.service_name,
        toHadoopServiceType(info.service_name)
      )
    }
  }

  override def retrieveClientConfigs(clusterId: String): Map[String, String] = {
    val filesToKeep = HadoopConfigNames.values.map(_.toString)

    val clientConfigs = Set(HDFS_service, OOZIE_service, HIVE_service, mapreduce2_service, YARN_service, HBASE_service)
    val files = clientConfigs.flatMap { config =>
      try {
        Some(await(hdpClient.getServiceConfig(clusterId, config, conn)))
      } catch {
        case e: Exception =>
          logger.warn("Error config archive read: " + e.getMessage)
          None
      }
    }

    val unpacked: Set[(String, Array[Byte])] = files.flatMap { file =>
      try {
        Some(PackUtils.unpackTarGZip(file))
      } catch {
        case e: Exception =>
          logger.warn("Error config archive extract: " + e.getMessage)
          None
      }
    }.flatten

    val configs = unpacked.foldLeft(Map.empty[String, Map[String, ConfigEntry]]) { (configsByName, content) =>
      val (fileName, rawContent) = content
      val name = if (fileName.indexOf("/") >= 0) fileName.substring(fileName.lastIndexOf('/') + 1) else fileName

      if (filesToKeep contains name) {
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

  private def await[T](f: Future[T]): T = {
    Await.result(f, appConf.outgoingHttpRqTimeoutMs * 2 milliseconds)
  }

  private def toHadoopServiceType(ambariType: String) = {
    ambariType match {
      case OOZIE_service => HadoopServiceTypes.oozieRuntime
      case other => other
    }
  }
}

