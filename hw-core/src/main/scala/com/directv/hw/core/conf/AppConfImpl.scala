package com.directv.hw.core.conf

import java.io.File

import com.directv.hw.common.io.DapIoUtils
import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.provision.model.ProvisionUrl
import com.typesafe.config._
import com.typesafe.scalalogging.LazyLogging
import net.ceedubs.ficus.Ficus._
import net.ceedubs.ficus.readers.ValueReader
import org.apache.commons.io.FilenameUtils

object AppConfImpl {

  val appHomeEnvProp = "HW_HOME"
  val siteEnvProp = "SITE"
  val userEnvProp = "USER"
  
  val userHomeSysProp = "user.home"
  val appHomeSysProp = "hw.home"
  val krbConfSysProp = "java.security.krb5.conf"
  
  val sep = File.separator

  implicit val serviceConfigReader: ValueReader[ProvisionUrl] = ValueReader.relative { config =>
    ProvisionUrl(config.as[String]("title"), config.as[String]("url"), `type` = config.as[String]("type"))
  }
}

class AppConfImpl(envProps: Map[String, String], logConfigurator: LoggerConfigurator) extends AppConf with LazyLogging {

  import AppConfImpl._

  val baseDir = envProps.getOrElse(appHomeEnvProp, FilenameUtils.concat(System.getProperty(userHomeSysProp),".hw"))
  System.setProperty(appHomeSysProp, baseDir)
  System.setProperty(krbConfSysProp, confDir + sep + "krb5.conf")

  logConfigurator.initLogConfiguration(confDir)

  logger.debug(s"App base dir - $baseDir")

  private val userConf = parseConf(envProps.get(userEnvProp))
  private val siteConf = parseConf(envProps.get(siteEnvProp))
  private val appConf = parseConf(None)

  private val privateConf = ConfigFactory.defaultOverrides()
    .withFallback(userConf)
    .withFallback(siteConf)
    .withFallback(appConf)
    .withFallback(ConfigFactory.load().config)

  override lazy val config = ConfigFactory.load(privateConf)

  override lazy val pluginDir = config.as[Option[String]]("hw.plugin.dir").getOrElse(baseDir + sep + "plugins")
  override lazy val confDir = mkdir (baseDir + sep + "conf")
  override lazy val scriptsDir = mkdir (baseDir + sep + "scripts")
  override lazy val cacheDir = mkdir(baseDir + sep + "cache")
  override lazy val logsDir = mkdir (baseDir + sep + "logs")
  override lazy val accessKeyDir = mkdir (baseDir + sep + "keys")
  override lazy val repositoryDir = mkdir (baseDir + sep + "repository")
  override lazy val clusterConfDir = mkdir (repositoryDir + sep + "configs")
  override lazy val tenantsDir = mkdir (repositoryDir + sep + "tenants")
  override lazy val kamonEnabled = config.as[Boolean]("kamon.enabled")

  override lazy val dbDriver = config.as[String]("hw.db.driver")
  override lazy val dbUrl = config.as[String]("hw.db.url")
  override lazy val dbUser = config.as[String]("hw.db.user")
  override lazy val dbPassword = config.as[String]("hw.db.password")
  override lazy val dbWaitTimeout = config.as[Int]("hw.db.waitTimeout")

  override lazy val startupOozieIndexation = config.as[Boolean]("hw.startup.oozie.indexation.enabled")
  override lazy val appUser = config.as[String]("hw.user")
  override lazy val defaultTeam = config.as[String]("hw.default.team")

  override lazy val ldapHost = config.as[String]("hw.ldap.host")
  override lazy val ldapPort = config.as[Int]("hw.ldap.port")
  override lazy val ldapBindUser = config.as[String]("hw.ldap.user.name")
  override lazy val ldapBindPassword = config.as[String]("hw.ldap.user.password")
  override lazy val ldapUserBaseDn = config.as[String]("hw.ldap.user.base.dn")
  override lazy val ldapUserNameAttr = config.as[String]("hw.ldap.user.attribute")
  override lazy val ldapSslEnabled = config.as[Boolean]("hw.ldap.ssl.enabled")
  override lazy val sessionTimeoutSec = config.as[Long]("hw.session.timeout.seconds")
  override lazy val s3UploadBufferSize = config.as[Int]("hw.s3.upload.buffer.size")

  override lazy val hdfsDefaultUser = config.as[String]("hw.hdfs.default.user")
  override lazy val hdfsDefaultProtocol = config.as[String]("hw.hdfs.default.protocol")
  override lazy val hdfsDefaultPort: Int = config.as[Int]("hw.hdfs.default.port")

  override lazy val incomingHttpRqTimeoutMs = config.as[Int]("hw.http.incoming.request.timeout.ms")
  override lazy val incomingHttpContentLimitKBytes = config.as[Long]("hw.http.incoming.content.limit.kbytes")
  override lazy val outgoingHttpRqTimeoutMs = config.as[Int]("hw.http.outgoing.request.timeout.ms")
  override lazy val outgoingHttpConnectTimeoutMs = config.as[Int]("hw.http.outgoing.connect.timeout.ms")
  override lazy val uploadHttpContentLimitMBytes = config.as[Long]("hw.http.upload.content.limit.mbytes")

  override lazy val platformStatusUpdateSec = config.as[Int]("hw.platform.status.update.interval.seconds")
  override lazy val platformConfigUpdateSec = config.as[Int]("hw.platform.configs.update.interval.seconds")
  override lazy val flumeCacheUpdateSec = config.as[Int]("hw.flume.cache.update.interval.seconds")
  override lazy val provisionStatusUpdateSec = config.as[Int]("hw.provision.status.update.interval.seconds")
  override lazy val provisionUrls = config.as[List[ProvisionUrl]]("hw.provision.urls")

  override lazy val menuDisabled = config.as[String]("hw.menu.disabled")

  override lazy val externalExecutor = config.as[String]("hw.externalExecutor")
  override lazy val shellScriptPrefixes = config.as[Seq[String]]("hw.script.shellPrefixes")
  override lazy val hdfsAppPath = config.as[String]("hw.hdfs.app.path")
  override lazy val hdfsDefaultBasePath = config.as[String]("hw.hdfs.default.base.path")
  override lazy val cicdEnvMap = config.as[Map[String, String]]("hw.cicd.env.map")

  override lazy val awsAccessKey: String = config.as[String]("hw.aws.access.key")
  override lazy val awsSecretKey: String = config.as[String]("hw.aws.secret.key")
  override lazy val awsRegion: String = config.as[String]("hw.aws.region")
  override lazy val awsS3Bucket: String = config.as[String]("hw.aws.s3.bucket")

  override lazy val uiSettings: String = config.getConfig("hw.ui.settings").root().render(ConfigRenderOptions.concise())

  private def parseConf(suffixOpt: Option[String]): Config = {
    val fileName = suffixOpt match {
      case None => "application.conf"
      case Some(suffix) => s"application-$suffix.conf"
    }

    val confPath = confDir + sep + fileName
    logger.debug(s"Reading config file - $confPath")
    val options = ConfigParseOptions.defaults().setAllowMissing(true).setSyntax(ConfigSyntax.CONF)
    ConfigFactory.parseFile(new File(confPath), options)
  }

  private def mkdir(dir: String): String = {
    DapIoUtils.ensureDirExists(new File(dir))
    dir
  }
}