package com.directv.hw.hadoop.config

import com.directv.hw.core.service.HadoopConfigNames
import com.directv.hw.core.service.HadoopConfigNames.HadoopConfigName
import com.directv.hw.hadoop.model.ClusterPath
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}

class ClientSitePropsImpl(clusterPath: ClusterPath)(implicit injector: Injector)
  extends ClientSiteProps with Injectable with LazyLogging {

  private val configConverter = inject[ConfigConverter]
  private val configRepo = inject[ClusterConfigService]

  private lazy val coreSiteProps = getClientProps(HadoopConfigNames.CoreSite)
  private lazy val yarnSiteProps = getClientProps(HadoopConfigNames.YarnSite)
  private lazy val mapRedSiteProps = getClientProps(HadoopConfigNames.MapRedSite)
  private lazy val hiveSiteProps = getClientProps(HadoopConfigNames.HiveSite)
  private lazy val hbaseSiteProps = getClientProps(HadoopConfigNames.HbaseSite)
  private lazy val oozieSiteProps = getClientProps(HadoopConfigNames.OozieSite)
  
  override lazy val nameNode: Option[String] = findValue(coreSiteProps, "fs.defaultFS")
  override lazy val securityAuthentication: Option[String] = findValue(coreSiteProps, "hadoop.security.authentication")
  override lazy val oozieLibPath: Option[String] = nameNode.map(url => s"$url/user/oozie/share/lib")
  override lazy val jobTracker: Option[String] = findValue(yarnSiteProps, "yarn.resourcemanager.address")
    .orElse(findValue(mapRedSiteProps, "mapred.job.tracker"))


  override lazy val hiveMetaStoreUris: Option[String] = findValue(hiveSiteProps, "hive.metastore.uris")
  override lazy val hiveZookeeperQuorum: Option[String] = findValue(hiveSiteProps, "hive.zookeeper.quorum")
  override lazy val hiveZookeeperClientPort: Option[String] = findValue(hiveSiteProps, "hive.zookeeper.client.port")
  override lazy val hiveMetastoreKrbPrincipal: Option[String] = findValue(hiveSiteProps, "hive.metastore.kerberos.principal")
  override lazy val hbaseZookeeperQuorum: Option[String] = findValue(hbaseSiteProps, "hbase.zookeeper.quorum")
  override lazy val hbaseZookeeperClientPort: Option[String] = findValue(hbaseSiteProps, "hbase.zookeeper.property.clientPort")
  override lazy val oozieServer: Option[String] = findValue(oozieSiteProps, "oozie.base.url")

  private def findValue(config: List[ConfigEntry], key: String): Option[String] = {
    config.find(_.key == key).map(_.value)
  }

  private def getClientProps(fileName: HadoopConfigName): List[ConfigEntry] = {
    configRepo.getConfig(clusterPath, fileName).map(configConverter.toConfig).getOrElse(List.empty)
  }
}

