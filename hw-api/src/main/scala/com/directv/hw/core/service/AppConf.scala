package com.directv.hw.core.service

import com.directv.hw.hadoop.provision.model.ProvisionUrl
import com.typesafe.config.Config

trait AppConf {
  def config: Config
  def repositoryDir: String
  def tenantsDir: String
  def kamonEnabled: Boolean

  def pluginDir: String
  def confDir: String
  def clusterConfDir: String
  def scriptsDir: String
  def cacheDir: String
  def logsDir: String
  def dbDriver: String

  def dbUrl: String
  def dbUser: String
  def dbPassword: String
  def dbWaitTimeout: Int

  def startupOozieIndexation: Boolean
  def appUser: String
  def defaultTeam: String

  def ldapHost: String
  def ldapPort: Int
  def ldapBindUser: String
  def ldapBindPassword: String
  def ldapUserBaseDn: String
  def ldapUserNameAttr: String
  def ldapSslEnabled: Boolean
  def sessionTimeoutSec: Long
  def s3UploadBufferSize: Int

  def hdfsDefaultUser: String
  def hdfsDefaultProtocol: String
  def hdfsDefaultPort: Int

  def incomingHttpRqTimeoutMs: Int
  def incomingHttpContentLimitKBytes: Long
  def outgoingHttpRqTimeoutMs: Int
  def outgoingHttpConnectTimeoutMs: Int
  def uploadHttpContentLimitMBytes: Long

  def platformStatusUpdateSec: Int
  def platformConfigUpdateSec: Int
  def accessKeyDir: String
  def flumeCacheUpdateSec: Int
  def provisionStatusUpdateSec: Int
  def provisionUrls: List[ProvisionUrl]
  def menuDisabled: String
  def externalExecutor: String
  def shellScriptPrefixes: Seq[String]
  def hdfsAppPath: String
  def hdfsDefaultBasePath: String
  def cicdEnvMap: Map[String, String]

  def awsAccessKey: String
  def awsSecretKey: String
  def awsRegion: String
  def awsS3Bucket: String

  def uiSettings: String
}