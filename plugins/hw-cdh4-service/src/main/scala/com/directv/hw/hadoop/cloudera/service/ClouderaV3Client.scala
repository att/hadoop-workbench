package com.directv.hw.hadoop.cloudera.service

import java.io.InputStream
import javax.ws.rs.client.ClientException
import javax.ws.rs.{NotFoundException, WebApplicationException}

import com.cloudera.api.DataView
import com.cloudera.api.model.ApiRole.HaStatus
import com.cloudera.api.model._
import com.cloudera.api.v2.RolesResourceV2
import com.cloudera.api.v3.{RoleCommandsResourceV3, RoleConfigGroupsResource, RootResourceV3}
import com.directv.hw.common.io.DapIoUtils
import com.directv.hw.core.exception.{CalleeException, DapException}
import com.directv.hw.hadoop.cloudera.model._
import com.directv.hw.hadoop.http.client.{BadResponseException, ConnectionException, UnknownHostException}
import com.directv.hw.hadoop.model.{RelativeModulePath, RelativeServicePath}
import com.directv.hw.hadoop.platform.cloudera.ClouderaServiceType
import com.directv.hw.hadoop.platform.model.BasicOozieServiceInfo
import com.typesafe.scalalogging.LazyLogging
import org.apache.commons.io.IOUtils

import scala.collection.JavaConversions._
import scala.collection.JavaConverters._
import scala.io.Source
import scala.language.postfixOps
import spray.json.DefaultJsonProtocol._
import spray.json._

object ClouderaRoleType {
  val agent = "AGENT"
  val nameNode = "NAMENODE"
  val jobTracker = "JOBTRACKER"
  val resourceManager = "RESOURCEMANAGER"
  val oozieServer = "OOZIE_SERVER"
  val hiveMetastore = "HIVEMETASTORE"
}

object ClouderaConfigName {
  val nameNodePort = "namenode_port"
  val dfsHttpPort = "dfs_http_port"
  val jobTrackerPort = "job_tracker_port"
  val jobTrackerHttpPort = "mapred_job_tracker_http_port"
  val resourceTrackerPort = "yarn_resourcemanager_address"
  val resourceManagerWebPort = "resourcemanager_webserver_port"
  val oozieShareLibDir = "oozie_sharelib_rootdir"
  val quorumPort = "quorumPort"
  val hiveMetastorePort = "hive_metastore_port"
  val kerberosPrincipal = "kerberos_princ_name"
}

class ClouderaV3Client(root: RootResourceV3) extends ClouderaClient with LazyLogging {
  private val clientConfigTypes = Set (
    ClouderaServiceType.hdfs,
    ClouderaServiceType.hbase,
    ClouderaServiceType.hive,
    ClouderaServiceType.yarn,
    ClouderaServiceType.mapReduce
  )

  implicit val clouderaMessageFormat = jsonFormat1(ClouderaMessage)

  override def getClusters: List[ClouderaCluster] = {
    clouderaCall {
      root.getClustersResource.readClusters(DataView.SUMMARY).getClusters
        .map(apiCluster => ClouderaCluster(apiCluster.getName, apiCluster.getDisplayName))
        .toList
    }
  }

  override def getServices(clusterId: String): List[ClouderaServiceInfo] = {
    clouderaCall {
      root.getClustersResource.getServicesResource(clusterId).readServices(DataView.SUMMARY)
        .map(apiService => ClouderaServiceInfo(apiService.getName, apiService.getDisplayName, apiService.getType))
        .toList
    }
  }

  override def getRoleGroups(servicePath: RelativeServicePath): List[ClouderaRoleGroup] = {
    clouderaCall {
      configGroupResource(servicePath).readRoleConfigGroups.getGroups.toList
        .filter(_.getRoleType == ClouderaRoleType.agent)
        .map(toModelGroup)
    }
  }

  override def getRoleGroup(modulePath: RelativeModulePath): ClouderaRoleGroup = {
    clouderaCall {
      val group = configGroupResource(modulePath).readRoleConfigGroup(modulePath.moduleId)
      toModelGroup(group)
    }
  }

  override def getRoleGroupConfig(modulePath: RelativeModulePath): Map[String, ClouderaConfigItem] = {
    clouderaCall {
      toModelConfig(configGroupResource(modulePath).readConfig(modulePath.moduleId, DataView.FULL))
    }
  }

  override def createRoleGroup(servicePath: RelativeServicePath, group: ClouderaRoleGroup) = {
    clouderaCall {
      configGroupResource(servicePath).createRoleConfigGroups(new ApiRoleConfigGroupList(List(toApi(group))))
    }
  }

  override def updateRoleGroup(servicePath: RelativeServicePath, group: ClouderaRoleGroup) = {
    clouderaCall {
      val apiGroup = toApi(group)
      configGroupResource(servicePath).updateRoleConfigGroup(apiGroup.getName, apiGroup, "")
    }
  }

  override def updateRoleGroupConfig(servicePath: RelativeServicePath, groupId: String, config: Map[String, ClouderaConfigItem]) = {
    clouderaCall {
      configGroupResource(servicePath).updateConfig(groupId, "", toApiConfigList(config))
    }
  }

  override def deleteRoleGroup(modulePath: RelativeModulePath): Unit = {
    clouderaCall {
      configGroupResource(modulePath).deleteRoleConfigGroup(modulePath.moduleId)
    }
  }

  override def getRoles(modulePath: RelativeModulePath): List[ClouderaRole] = {
    clouderaCall ({
      rolesResource(modulePath).readRoles() withFilter { apiRole =>
        Option(apiRole.getRoleConfigGroupRef) flatMap (ref => Option(ref.getRoleConfigGroupName)) contains modulePath.moduleId
      } map toModelRole toList
    }, {
      case e: NotFoundException =>
        logger.error(s"Could not find roles for module [$modulePath]", e)
        List.empty
    })
  }

  override def getRole(modulePath: RelativeModulePath, roleId: String): ClouderaRole = {
    clouderaCall {
      val role = rolesResource(modulePath).readRole(roleId)
      toModelRole(role)
    }
  }

  override def getRoleConfig(modulePath: RelativeModulePath, roleId: String): Map[String, ClouderaConfigItem] = {
    clouderaCall {
      toModelConfig(rolesResource(modulePath).readRoleConfig(roleId, DataView.FULL))
    }
  }

  override def createRole(modulePath: RelativeModulePath, hostId: String): ClouderaRole = {
    clouderaCall {
      val role = new ApiRole()
      val hostRef = new ApiHostRef(hostId)
      role.setHostRef(hostRef)
      val groupRef = new ApiRoleConfigGroupRef(modulePath.moduleId())
      role.setRoleConfigGroupRef(groupRef)
      val name = s"flume${System.currentTimeMillis()}"
      role.setName(name)
      role.setType(ClouderaRoleType.agent)
      val roleList = new ApiRoleList(List(role).asJava)
      val createdRoles = rolesResource(modulePath).createRoles(roleList).getRoles

      val createdRole = if (createdRoles.nonEmpty) {
        createdRoles.head
      } else {
        throw new DapException(s"Role was not created on Cloudera")
      }

      // TODO (vkolischuk) workaround for Cloudera 4
      if (createdRole.getRoleConfigGroupRef.getRoleConfigGroupName != modulePath.moduleId()) {
        val list = new ApiRoleNameList(List(createdRole.getName).asJava)
        configGroupResource(modulePath).moveRoles(modulePath.moduleId(), list)
      }

      toModelRole(createdRole)
    }
  }

  override def updateRoleConfig(modulePath: RelativeModulePath, roleId: String, config: Map[String, ClouderaConfigItem]) = {
    clouderaCall {
      rolesResource(modulePath).updateRoleConfig(roleId, "", toApiConfigList(config))
    }
  }

  override def deleteRole(modulePath: RelativeModulePath, roleId: String) = {
    clouderaCall {
      rolesResource(modulePath).deleteRole(roleId)
    }
  }

  override def startRole(modulePath: RelativeModulePath, roleId: String): ClouderaRole = {
    clouderaCall {
      executeRoleCommand(modulePath, roleId, roleCommandsResource(modulePath).startCommand)
    }
  }

  override def stopRole(modulePath: RelativeModulePath, roleId: String): ClouderaRole = {
    clouderaCall {
      executeRoleCommand(modulePath, roleId, roleCommandsResource(modulePath).stopCommand)
    }
  }

  override def getActiveNameNode(clusterId: String): Option[ClouderaHdfsHost] = {
    clouderaCall {
      val servicesResource = root.getClustersResource.getServicesResource(clusterId)
      servicesResource.readServices(DataView.SUMMARY)
        .toList.find(_.getType == ClouderaServiceType.hdfs).flatMap { hdfsSrv =>

        val rolesResource = servicesResource.getRolesResource(hdfsSrv.getName)
        rolesResource.readRoles().getRoles.toList
          .find(node => node.getType == ClouderaRoleType.nameNode && node.getHaStatus == HaStatus.ACTIVE)
          .map { nameNodeRole =>

            val configs = rolesResource.readRoleConfig(nameNodeRole.getName, DataView.FULL).getConfigs.toList
            val portConfig = configs.find(_.getName == ClouderaConfigName.nameNodePort).get
            val httpPortConfig = configs.find(_.getName == ClouderaConfigName.dfsHttpPort).get

            val host = root.getHostsResource.readHost(nameNodeRole.getHostRef.getHostId).getHostname
            val port = Option(portConfig.getValue).getOrElse(portConfig.getDefaultValue)
            val httpPort = Option(httpPortConfig.getValue).getOrElse(httpPortConfig.getDefaultValue)

            ClouderaHdfsHost(host, port, httpPort, hdfsSrv.getName)
        }
      }
    }
  }

  override def getZookeeperQuorum(clusterId: String): List[ClouderaServiceHost] = {
    clouderaCall {
      val servicesResource = root.getClustersResource.getServicesResource(clusterId)
      val zookeeperService = servicesResource.readServices(DataView.SUMMARY).toList
        .find(_.getType == ClouderaServiceType.zookeeper).get

      val rolesResource = servicesResource.getRolesResource(zookeeperService.getName)
      val roles = rolesResource.readRoles().getRoles.toList
      roles.map { role =>
        val portConfig = rolesResource.readRoleConfig(role.getName, DataView.FULL).getConfigs.toList
          .find(_.getName == ClouderaConfigName.quorumPort).get

        val host = root.getHostsResource.readHost(role.getHostRef.getHostId).getHostname
        val port = Option(portConfig.getValue).getOrElse(portConfig.getDefaultValue)
        ClouderaServiceHost(host, port)
      }
    }
  }

  override def getHiveMetastore(clusterId: String): ClouderaHiveMetastore = {
    clouderaCall {
      val servicesResource = root.getClustersResource.getServicesResource(clusterId)
      val hiveSrv = servicesResource.readServices(DataView.SUMMARY).toList
        .find(_.getType == ClouderaServiceType.hive).get

      val rolesResource = servicesResource.getRolesResource(hiveSrv.getName)
      val metastore = rolesResource.readRoles().getRoles.toList
        .find(_.getType == ClouderaRoleType.hiveMetastore).get
      val portConfig = rolesResource.readRoleConfig(metastore.getName, DataView.FULL).getConfigs.toList
        .find(_.getName == ClouderaConfigName.hiveMetastorePort).get

      val host = root.getHostsResource.readHost(metastore.getHostRef.getHostId).getHostname
      val port = Option(portConfig.getValue).getOrElse(portConfig.getDefaultValue)

      val principal = servicesResource.readServiceConfig(hiveSrv.getName, DataView.FULL).toList
        .find(_.getName == ClouderaConfigName.kerberosPrincipal).get

      val principalValue = Option(principal.getValue).getOrElse(principal.getDefaultValue)

      ClouderaHiveMetastore(ClouderaServiceHost(host, port), principalValue)
    }
  }

  override def getOozieShareLibPath(clusterId: String): String = {
    clouderaCall {
      val servicesResource = root.getClustersResource.getServicesResource(clusterId)
      val oozieSrv = servicesResource.readServices(DataView.SUMMARY).toList
        .find(_.getType == ClouderaServiceType.oozie).get

      val shareLibDir = servicesResource.readServiceConfig(oozieSrv.getName, DataView.FULL).toList
        .find(_.getName == ClouderaConfigName.oozieShareLibDir).get

      Option(shareLibDir.getValue).getOrElse(shareLibDir.getDefaultValue)
    }
  }

  override def getOozieServiceInfo(clusterId: String): BasicOozieServiceInfo = {
    def getValue(map: Map[String, ClouderaConfigItem], key: String) = map get key flatMap (i => i.value orElse i.default)

    clouderaCall {
      val servicesResource = root.getClustersResource.getServicesResource(clusterId)
      servicesResource.readServices(DataView.SUMMARY).find(_.getType == ClouderaServiceType.oozie) map { service =>
        val serviceConfig = toModelConfig(servicesResource.readServiceConfig(service.getName, DataView.FULL))
        val useSsl = getValue(serviceConfig, "oozie_use_ssl") map (_.toBoolean)
        val protocol = useSsl map (if(_) "https" else "http")

        val rolesResource = servicesResource.getRolesResource(service.getName)
        val role = Option(rolesResource.readRoles().getRoles) flatMap (_.headOption)
        val roleConfig = role map (r => rolesResource.readRoleConfig(r.getName, DataView.FULL)) map toModelConfig getOrElse Map.empty
        val host: Option[ClouderaHost] = role flatMap (r => Option(r.getHostRef)) map (_.getHostId) map findHost
        val hostName = host map (h => h.hostname getOrElse h.ipAddress)
        val port = useSsl flatMap { isSsl =>
          getValue(roleConfig, if(isSsl) "oozie_https_port" else "oozie_http_port")
        } map (_.toInt)

        BasicOozieServiceInfo(Some(service.getName), hostName, port, protocol, None)
      } getOrElse BasicOozieServiceInfo(None, None, None, None, None)
    }
  }

  override def getActiveJobTrackerHttpHost(clusterId: String): Option[ClouderaServiceHost] = {
    clouderaCall {
      getActiveServiceHost (
        clusterId,
        ClouderaServiceType.mapReduce,
        ClouderaRoleType.jobTracker,
        ClouderaConfigName.jobTrackerHttpPort)
    }
  }

  override def getActiveResourceManagerHttpHost(clusterId: String): Option[ClouderaServiceHost] = {
    clouderaCall {
      getActiveServiceHost (
        clusterId,
        ClouderaServiceType.yarn,
        ClouderaRoleType.resourceManager,
        ClouderaConfigName.resourceManagerWebPort)
    }
  }

  private def getActiveServiceHost(clusterId: String,
                           serviceType: String,
                           roleType: String,
                           webPortProperty: String): Option[ClouderaServiceHost] = {

    val servicesResource = root.getClustersResource.getServicesResource(clusterId)
    servicesResource.readServices(DataView.SUMMARY)
      .toList.find(_.getType == serviceType).flatMap { yarnSrv =>

      val rolesResource = servicesResource.getRolesResource(yarnSrv.getName)
      rolesResource.readRoles().getRoles.toList
        .find(node => node.getType == roleType && node.getHaStatus == HaStatus.ACTIVE)
        .map { resourceManager =>

          val configs = rolesResource.readRoleConfig(resourceManager.getName, DataView.FULL).getConfigs.toList
          val httpPortConfig = configs.find(_.getName == webPortProperty).get

          val host = root.getHostsResource.readHost(resourceManager.getHostRef.getHostId).getHostname
          val httpPort = Option(httpPortConfig.getValue).getOrElse(httpPortConfig.getDefaultValue)

          ClouderaServiceHost(host, httpPort)
        }
    }
  }

  private def getServiceHost(clusterId: String, srvType: String, roleType: String, portProp: String): Option[ClouderaServiceHost] = {
    val servicesResource = root.getClustersResource.getServicesResource(clusterId)
    servicesResource.readServices(DataView.SUMMARY).toList
      .find(_.getType == srvType).flatMap { mrSrv =>

      val rolesResource = servicesResource.getRolesResource(mrSrv.getName)
      rolesResource.readRoles().getRoles.toList.find(_.getType == roleType).map { jobTrackerRole =>
        val host = root.getHostsResource.readHost(jobTrackerRole.getHostRef.getHostId).getHostname
        val portConfig = rolesResource.readRoleConfig(jobTrackerRole.getName, DataView.FULL).getConfigs.toList
          .find(_.getName == portProp).get
        val port = Option(portConfig.getValue).getOrElse(portConfig.getDefaultValue)
        ClouderaServiceHost(host, port)
      }
    }
  }

  override def getHosts(clusterId: String): List[ClouderaHost] = {
    clouderaCall {
      val allHosts = root.getHostsResource.readHosts(DataView.SUMMARY).getHosts.asScala.map { h =>
        h.getHostId -> h
      }.toMap
      root.getClustersResource.listHosts(clusterId).asScala.toList flatMap { hostId =>
        allHosts.get(hostId.getHostId) map toModelHost
      }
    }
  }

  override def findHost(hostId: String): ClouderaHost = {
    clouderaCall {
      val apiHost = root.getHostsResource.readHost(hostId)
      toModelHost(apiHost)
    }
  }

  override def retrieveClientConfigs(clusterId: String): List[Array[Byte]] = {
    val servicesResource = root.getClustersResource.getServicesResource(clusterId)
    val services = Option(servicesResource.readServices(DataView.SUMMARY)) map (_.getServices.asScala.toList) getOrElse List.empty
    services collect {
      case service if clientConfigTypes contains service.getType =>
        DapIoUtils.managed2(servicesResource.getClientConfig(service.getName).getInputStream) { is =>
          IOUtils.toByteArray(is)
        }
    }
  }

  private def configGroupResource(servicePath: RelativeServicePath): RoleConfigGroupsResource = {
    root.getClustersResource.getServicesResource(servicePath.clusterId).getRoleConfigGroupsResource(servicePath.serviceId)
  }

  private def rolesResource(servicePath: RelativeServicePath): RolesResourceV2 = {
    root.getClustersResource.getServicesResource(servicePath.clusterId).getRolesResource(servicePath.serviceId)
  }

  private def roleCommandsResource(servicePath: RelativeServicePath): RoleCommandsResourceV3 = {
    root.getClustersResource.getServicesResource(servicePath.clusterId).getRoleCommandsResource(servicePath.serviceId)
  }

  private def toModelGroup(apiGroup: ApiRoleConfigGroup): ClouderaRoleGroup = {
    val configMap = toModelConfig(apiGroup.getConfig)
    ClouderaRoleGroup(apiGroup.getName, apiGroup.getDisplayName, configMap, apiGroup.isBase)
  }

  private def toModelConfig(apiConfigList: ApiConfigList): Map[String, ClouderaConfigItem] = {
    Option(apiConfigList) flatMap { configList =>
      Option(configList.getConfigs) map { configs =>
        configs map { apiConfig =>
          apiConfig.getName -> ClouderaConfigItem(Option(apiConfig.getValue), Option(apiConfig.getDefaultValue))
        } toMap
      }
    } getOrElse Map.empty
  }

  private def toApiConfigList(config: Map[String, ClouderaConfigItem]): ApiConfigList = {
    val list = config withFilter { case (key, item) => item.value.nonEmpty } map { case (key, value) =>
      new ApiConfig(key, value.value.get)
    } toList

    new ApiConfigList(list)
  }

  private def toApi(clouderaGroup: ClouderaRoleGroup): ApiRoleConfigGroup = {
    val group = new ApiRoleGroupExtended()

    group.setName(clouderaGroup.id)
    group.setDisplayName(clouderaGroup.title)
    group.setRoleType(ClouderaRoleType.agent)
    group.setConfig(toApiConfigList(clouderaGroup.config))

    group
  }

  private def toModelRole(r: ApiRole): ClouderaRole = {
    import ApiHealthSummary._
    val health = Option(r.getHealthSummary) collect {
      case GOOD => ClouderaHealthGood
      case BAD => ClouderaHealthBad
      case CONCERNING => ClouderaHealthConcerning
    } getOrElse ClouderaHealthUnknown

    import ApiRoleState._
    val state = Option(r.getRoleState) collect {
      case STARTED => ClouderaInstanceStarted
      case STOPPED => ClouderaInstanceStopped
      case STARTING | BUSY | STOPPING => ClouderaInstanceBusy
    } getOrElse ClouderaInstanceUnknown

    import ApiConfigStalenessStatus._
    //noinspection ScalaDeprecation
    val isStale = r.getConfigStale || Option(r.getConfigStalenessStatus).exists(s => s == STALE || s == STALE_REFRESHABLE)

    val configMap: Map[String, ClouderaConfigItem] = Option(r.getConfig) map (list => toModelConfig(list)) getOrElse Map.empty

    ClouderaRole(r.getName, r.getType, state, health, isStale, r.getHostRef.getHostId, configMap)
  }

  private def executeRoleCommand(modulePath: RelativeModulePath, roleId: String, cmd: ApiRoleNameList => ApiBulkCommandList): ClouderaRole = {
    val list = List(roleId)
    val apiList = new ApiRoleNameList(list.asJava)
    val bulkResult = cmd(apiList)

    processCommandResult(bulkResult)

    val role = rolesResource(modulePath).readRole(roleId)
    toModelRole(role)
  }

  private def processCommandResult(bulk: ApiBulkCommandList) = {
    val messages = bulk.getCommands.asScala.collect {
      case command if command.getSuccess == false || command.getResultMessage != null =>
        command.getResultMessage
    }

    if(messages.nonEmpty) {
      val errors = bulk.getErrors.asScala.mkString("\n")
      val combinedMessages = messages.mkString("\n")
      throw new CalleeException(s"Cloudera error: $combinedMessages\n$errors")
    }
  }

  private def toModelHost(apiHost: ApiHost): ClouderaHost = {
    ClouderaHost(apiHost.getHostId, apiHost.getIpAddress, Option(apiHost.getHostname))
  }

  private def clouderaCall[T](call: => T, exceptionHandler: PartialFunction[Throwable, T] = PartialFunction.empty): T = {

    try {
      call
    } catch {
      case e if exceptionHandler.isDefinedAt(e) =>
        exceptionHandler.apply(e)
      case e: WebApplicationException =>
        val response = e.getResponse
        val errorMessage = response.getStatus match {
          case 401 => "Bad credentials for CM"
          case _ => readInputStreamError(response.getEntity)
        }

        throw new BadResponseException(response.getStatus, "Cloudera error: " + errorMessage)
      case e: ClientException =>
        if (e.getCause == null || e.getCause.getCause == null) throw e
        val cause = e.getCause.getCause
        cause match {
          case ex: java.net.UnknownHostException => throw UnknownHostException(ex.getMessage, ex)
          case ex: java.net.SocketTimeoutException => throw ConnectionException(ex.getMessage, ex)
          case ex: java.net.ConnectException => throw ConnectionException(ex.getMessage, ex)
          case ex => throw ex
        }

      case e: Exception => throw e
    }
  }

  private def readInputStreamError(entiry: AnyRef) = {
    val errorMessage = entiry match {
      case is: InputStream =>
        val message = Source.fromInputStream(is).getLines().mkString("\n")
        parseClouderaMessage(message)
      case other =>
        "Unknown error"
    }
  }

  private def parseClouderaMessage[T](message: String): String = {
    try {
      val clouderaMessage = message.parseJson.convertTo[ClouderaMessage]
      clouderaMessage.message
    } catch {
      case e: Exception => message
    }
  }
}



