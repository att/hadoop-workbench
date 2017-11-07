package com.directv.hw.hadoop.flume.hortonworks

import akka.actor.ActorSystem
import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.core.exception.{NotSupportedException, ServerError}
import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.access.AccessManagerService
import com.directv.hw.hadoop.hortonworks.client._
import com.directv.hw.hadoop.hortonworks.client.{Component => HdpComponent}
import com.directv.hw.hadoop.hortonworks.client.exception._
import com.directv.hw.hadoop.host.model.PlatformHost
import com.directv.hw.hadoop.flume.hortonworks.HortonWorksFlumeService._
import com.directv.hw.hadoop.flume.model._
import com.directv.hw.hadoop.flume.service.FlumeService
import com.directv.hw.hadoop.model._
import com.directv.hw.persistence.entity.ApiEntity
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}

import scala.concurrent.{Await, ExecutionContext, Future}
import scala.concurrent.duration._
import scala.language.postfixOps

object HortonWorksFlumeService {
  val defaultGroupId = "-1"

  object ConfigType {
    val conf = "flume-conf"
    val env = "flume-env"
  }

  object ServiceType {
    val flume = "FLUME"
  }

  object ComponentName {
    val flume = "FLUME_HANDLER"
  }

  object ComponentStatus {
    val started = "STARTED"
    val installed = "INSTALLED"
  }

  object StatesMapping {

    private val states = Map(
      "INIT" -> InstanceState.BUSY,
      "INSTALLING" -> InstanceState.BUSY,
      "INSTALL_FAILED" -> InstanceState.STOPPED,
      "INSTALLED" -> InstanceState.STOPPED,
      "STARTING" -> InstanceState.BUSY,
      "STARTED" -> InstanceState.STARTED,
      "STOPPING" -> InstanceState.BUSY,
      "UNINSTALLING" -> InstanceState.BUSY,
      "UNINSTALLED" -> InstanceState.STOPPED,
      "WIPING_OUT" -> InstanceState.BUSY,
      "UPGRADING" -> InstanceState.BUSY,
      "MAINTENANCE" -> InstanceState.BUSY,
      "UNKNOWN" -> InstanceState.UNKNOWN
    )

    def apply(state: String): InstanceState = states(state)
  }
}

class HortonWorksFlumeService(platformId: Int, api: ApiEntity)(implicit injector: Injector) extends FlumeService with Injectable with LazyLogging {

  val appConf = inject[AppConf]
  val hdpClient = inject[HortonWorksClient]
  val url = s"${api.protocol}://${api.host}:${api.port}"
  val actorSystem = inject[ActorSystem]
  val pluginParser = new PluginParser
  val accessManager = inject[AccessManagerService]
  val dispatcherFactory = inject[DispatcherFactory]

  lazy val pluginDir = accessManager.findPlatformAccess(platformId).flatMap(_.pluginDirs.headOption).getOrElse("")

  implicit val conn = ConnectionInfo(url, api.user.getOrElse(""), api.password.getOrElse(""))
  implicit val dispatcher: ExecutionContext = dispatcherFactory.auxiliaryDispatcher

  override def createEmptyComponent(servicePath: RelativeServicePath, agent: String): String = {
    val config = ConfigGroupWrapper(ConfigGroup(None, agent, ServiceType.flume, servicePath.clusterId))
    try{
      await(hdpClient.createConfigGroup(servicePath.clusterId, config, conn)).resources.head.ConfigGroup.id.toString
    } catch {
      case e: ComponentAlreadyExists => throw new ServerError(s"component [${e.name}] already exists")
    }
  }

  override def listComponents(servicePath: RelativeServicePath): List[FlumeComponentInfo] = {
    val groups = getConfigGroups(servicePath.clusterId, servicePath.serviceId)
    groups.map(p => FlumeComponentInfo(p.id.get.toString, p.group_name, "", isBase = false))
  }

  override def deleteComponent(modulePath: RelativeModulePath): Unit = {
    await(hdpClient.deleteConfigGroup(modulePath.clusterId, modulePath.moduleId.toInt, conn))
  }

  override def getComponentConfig(modulePath: RelativeModulePath): FlumeComponentConfig = {
    val clusterId = modulePath.clusterId
    val groupConfig = getConfigGroup(clusterId, modulePath.moduleId)
    FlumeComponentConfig(groupConfig.group_name, "", pluginDir)
  }

  override def updateComponentConfig(modulePath: RelativeModulePath, updateInfo: FlumeComponentUpdate) = {
    // update not supported
    // do nothing here
  }

  override def getPipelineConfig(modulePath: RelativeModulePath): String = {
    val clusterId = modulePath.clusterId
    val configType = ConfigType.conf
    val config = getCurrentConfiguration(clusterId, configType, modulePath.moduleId).orElse {
      getCurrentConfiguration(clusterId, configType, defaultGroupId)
    }

    config.map(_.properties("content")).getOrElse("")
  }

  override def updatePiplelineConfig(modulePath: RelativeModulePath, pipelineContent: String): Unit = {
    val clusterId = modulePath.clusterId
    val group = getConfigGroup(clusterId, modulePath.moduleId)
    val props = Map("content" -> pipelineContent)
    val configType = ConfigType.conf
    val pipelineConfig = DesiredConfig(configType, "verions" + System.currentTimeMillis(), Some(props))
    val configs = pipelineConfig :: group.desired_configs.filterNot(_.`type` == configType)
    await(hdpClient.updateConfigGroup(group.copy(desired_configs = configs)))
  }

  override def createInstance(modulePath: RelativeModulePath, hostId: String): AgentInstance = {
    updateHostComponentState(modulePath, hostId, ComponentStatus.installed)

    val group = getConfigGroup(modulePath.clusterId, modulePath.moduleId)
    val groupUpdate = group.copy(hosts = HostConfigGroup(None, hostId) :: group.hosts)
    await(hdpClient.updateConfigGroup(groupUpdate))

    getAgentInstance(modulePath, hostId)
  }

  override def getInstance(modulePath: RelativeModulePath, instanceId: String): AgentInstance = {
    getAgentInstance(modulePath, instanceId)
  }

  private def getAgentInstance(modulePath: RelativeModulePath, instanceId: String): AgentInstance = {
    val host = await(hdpClient.getHost(modulePath.clusterId, instanceId))
    val component = await(hdpClient.getHostComponent(modulePath.clusterId, instanceId, ComponentName.flume))

    mkAgentInstance(modulePath, host, component)
  }

  def mkAgentInstance(modulePath: RelativeModulePath, host: Host, component: HdpComponent): AgentInstance = {
    val state = StatesMapping(component.state)
    AgentInstance(
      host.host_name,
      PlatformHost(host.host_name, host.ip, Some(host.host_name)),
      state,
      InstanceHealth.GOOD, // TODO: vvozdroganov - find out how to monitor health
      isStale = component.stale_configs && state == InstanceState.STARTED, // relevant only if started
      FlumeComponentConfig(modulePath.moduleId, "", pluginDir, isBase = false)
    )
  }

  override def startAgentInstance(modulePath: RelativeModulePath, instanceId: String): AgentInstance = {
    updateHostComponentState(modulePath, instanceId, ComponentStatus.started)
  }

  override def stopAgentInstance(modulePath: RelativeModulePath, instanceId: String): AgentInstance = {
    updateHostComponentState(modulePath, instanceId, ComponentStatus.installed)
  }

  override def deleteInstance(modulePath: RelativeModulePath, hostId: String): Unit = {
    updateHostComponentState(modulePath, hostId, ComponentStatus.installed)

    val group = getConfigGroup(modulePath.clusterId, modulePath.moduleId)
    val groupUpdate = group.copy(hosts = group.hosts.filterNot(_.host_name == hostId))
    await(hdpClient.updateConfigGroup(groupUpdate))
  }

  override def getInstances(modulePath: RelativeModulePath): AgentInstancesData = {
    val group = getConfigGroup(modulePath.clusterId, modulePath.moduleId)
    val allHosts = getHosts(modulePath.clusterId)
    val instances = group.hosts.par.map { h =>
      val component = await(hdpClient.getHostComponent(modulePath.clusterId, h.host_name, ComponentName.flume))
      val platformHost = allHosts.find(_.id == h.host_name).get
      val host = Host(modulePath.clusterId, h.host_name, h.host_name)
      mkAgentInstance(modulePath, host, component)
    } toList

    val groups = getConfigGroups(modulePath.clusterId, modulePath.serviceId)
    val busyHosts = groups.flatMap(_.hosts.map(_.host_name))
    val components = await(hdpClient.getComponentHosts(modulePath.clusterId, modulePath.serviceId, ComponentName.flume))
    val flumeHosts = components.map(_.host_name)
    val availableHosts = allHosts.filterNot(h => busyHosts.contains(h.id)).filter(h => flumeHosts.contains(h.id))
    AgentInstancesData(instances, availableHosts)
  }

  override def updateInstanceComponentConfig(modulePath: RelativeModulePath, instanceId: String, config: FlumeComponentUpdate): Unit = {
    // not supported
    // do nothing
  }

  override def getInstancePipelineConfig(modulePath: RelativeModulePath, instanceId: String): String = {
    throw new NotSupportedException()
  }

  override def updateInstancePipelineConfig(modulePath: RelativeModulePath, instanceId: String, textConfig: String) = {
    // not supported
    // do nothing
  }

  private def await[T](f: Future[T]): T = {
    val result = f.recover {
      case e: HdpClientException => throw new ServerError(e.getMessage, e)
    }

    Await.result(result, appConf.outgoingHttpRqTimeoutMs milliseconds)
  }

  private def updateHostComponentState(modulePath: RelativeModulePath, instanceId: String, state: String): AgentInstance = {
    await {
      hdpClient.updateHostComponentState(modulePath.clusterId, instanceId, ComponentName.flume, state)
    }

    getAgentInstance(modulePath, instanceId)
  }

  private def getConfigGroups(clusterId: String, serviceId: String) = {
    await(hdpClient.getConfigGroups(clusterId, serviceId, conn = conn)).items.map(_.ConfigGroup)
  }

  private def getConfigGroup(clusterId: String, groupId: String) = {
    val result = await(hdpClient.getConfigGroup(clusterId, groupId, conn))
    result.ConfigGroup
  }

  private def getCurrentConfiguration(clusterId: String, confType: String, groupId: String) = {
    val result = await(hdpClient.getCurrentConfigurations(clusterId, ServiceType.flume, groupId, conn))
    val configurations = result.items

    if (configurations.isEmpty) None
    else configurations.head.configurations.find(_.`type` == confType)
  }

  private def getHosts(clusterId: String): List[PlatformHost] = {
    await(hdpClient.getHosts(clusterId, conn))
      .items.map { p => PlatformHost(p.Hosts.host_name, p.Hosts.ip, Option(p.Hosts.host_name)) }
  }
}