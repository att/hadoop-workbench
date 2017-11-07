package com.directv.hw.hadoop.config

import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.persistence.dao.CustomClusterDataDao
import com.directv.hw.util.EnumObject
import scaldi.{Injectable, Injector}

trait MustacheClusterDictionary {
  def attributes(clusterPath: ClusterPath): Map[String, () => Option[String]]
}

object MustacheClusterProperties extends EnumObject[MustacheProperty] {
  val nameNode: MustacheProperty = register("nameNode")
  val jobTracker: MustacheProperty = register("jobTracker")
  val hiveMetastore: MustacheProperty = register("hive.metastore")
  val hiveZookeeperQuorum: MustacheProperty = register("hive.zookeeper.quorum")
  val zookeperQuorum: MustacheProperty = register("zookeeper.quorum")
  val hiveZookeeperClientPort: MustacheProperty = register("hive.zookeeper.client.port")
  val hiveMetastoreKrbPrincipal: MustacheProperty = register("hive.metastore.kerberos.principal")
  val hbaseZookeeperQuorum: MustacheProperty = register("hbase.zookeeper.quorum")
  val hbaseZookeeperClientPort: MustacheProperty = register("hbase.zookeeper.client.port")
  val securityAuth: MustacheProperty = register("security.authentication")
  val oozieServer: MustacheProperty = register("oozie.server")
  val oozieLibPath: MustacheProperty = register("oozie.lib.path")
  val useOozieSystemLibPath: MustacheProperty = register("oozie.use.system.libpath")
  val queueName: MustacheProperty = register("queueName")

  private def register(key: String, desc: Option[String] = None): MustacheProperty = {
    register(MustacheProperty(key, desc))
  }
}

class MustacheClusterDictionaryImpl(implicit injector: Injector) extends MustacheClusterDictionary with Injectable {

  import MustacheClusterProperties._

  private val clientSitePropsFactory =  inject[ClientSitePropsFactory]
  private val customClusterDataDao = inject[CustomClusterDataDao]

  def attributes(clusterPath: ClusterPath): Map[String, () => Option[String]] = {
    val siteProps = clientSitePropsFactory.getClientSiteProps(clusterPath)

    lazy val nameNodeValue = siteProps.nameNode
    lazy val jobTrackerValue = siteProps.jobTracker
    lazy val oozieLibPathValue = siteProps.oozieLibPath
    lazy val oozieServerValue = siteProps.oozieServer
    lazy val hiveMetastoreValue = siteProps.hiveMetaStoreUris
    lazy val hiveZookeeperQuorumValue = siteProps.hiveZookeeperQuorum
    lazy val hiveZookeeperClientPortValue = siteProps.hiveZookeeperClientPort
    lazy val hiveMetastoreKrbPrincipalValue = siteProps.hiveMetastoreKrbPrincipal
    lazy val hbaseZookeeperQuorumValue = siteProps.hbaseZookeeperQuorum
    lazy val hbaseZookeeperClientPortValue = siteProps.hbaseZookeeperClientPort
    lazy val authenticationValue = siteProps.securityAuthentication
    lazy val useOozieSystemLibPathValue = Some("true")
    lazy val queueNameValue = Some("default")

    val defaultProps = Map (
      nameNode -> nameNodeValue _,
      jobTracker -> jobTrackerValue _,
      hiveMetastore -> hiveMetastoreValue _,
      hiveZookeeperQuorum -> hiveZookeeperQuorumValue _,
      zookeperQuorum -> hiveZookeeperQuorumValue _, // to be compliant with bigdata team
      hiveZookeeperClientPort -> hiveZookeeperClientPortValue _,
      hiveMetastoreKrbPrincipal ->  hiveMetastoreKrbPrincipalValue _,
      hbaseZookeeperQuorum -> hbaseZookeeperQuorumValue _,
      hbaseZookeeperClientPort -> hbaseZookeeperClientPortValue _,
      securityAuth -> authenticationValue _,
      oozieServer -> oozieServerValue _,
      oozieLibPath -> oozieLibPathValue _,
      useOozieSystemLibPath -> useOozieSystemLibPathValue _,
      queueName -> queueNameValue _
    ) map { entry => (entry._1.key, entry._2) }

    val customProps: Map[String, () => Option[String]] = customClusterDataDao.findByCluster(clusterPath).map(prop => (prop.key, () => Some(prop.value))).toMap
    defaultProps ++ customProps
  }
}