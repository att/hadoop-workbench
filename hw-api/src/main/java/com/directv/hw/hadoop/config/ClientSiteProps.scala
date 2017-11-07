package com.directv.hw.hadoop.config

trait ClientSiteProps {




  def nameNode: Option[String]
  def securityAuthentication: Option[String]
  def oozieLibPath: Option[String]
  def jobTracker: Option[String]
  def oozieServer: Option[String]
  def hiveMetaStoreUris: Option[String]
  def hiveZookeeperQuorum: Option[String]
  def hiveMetastoreKrbPrincipal: Option[String]
  def hiveZookeeperClientPort: Option[String]
  def hbaseZookeeperQuorum: Option[String]
  def hbaseZookeeperClientPort: Option[String]
}
