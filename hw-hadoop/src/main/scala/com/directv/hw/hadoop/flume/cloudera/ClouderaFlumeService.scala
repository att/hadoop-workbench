package com.directv.hw.hadoop.flume.cloudera

import com.directv.hw.hadoop.cloudera.ClouderaCommon._
import com.directv.hw.hadoop.cloudera.model._
import com.directv.hw.hadoop.cloudera.service.ClouderaClient
import com.directv.hw.hadoop.host.model.PlatformHost
import com.directv.hw.hadoop.flume.model._
import com.directv.hw.hadoop.flume.service.FlumeService
import com.directv.hw.hadoop.model._
import scaldi.{Injectable, Injector}

import scala.language.postfixOps

class ClouderaFlumeService(cloudera: ClouderaClient)(implicit injector: Injector)
  extends FlumeService with Injectable {


  override def listComponents(servicePath: RelativeServicePath): List[FlumeComponentInfo] = {
    cloudera.getRoleGroups(servicePath).map { group =>
      val config = values(group.config)
      FlumeComponentInfo(group.id, group.title, config(keyAgentName), group.isBase)
    }
  }

  override def createEmptyComponent(servicePath: RelativeServicePath, agent: String): String = {
    val id = s"flume-agent-${System.currentTimeMillis}"
    val group = ClouderaRoleGroup(id, agent, Map.empty)
    cloudera.createRoleGroup(servicePath, group)
    id
  }

  override def getComponentConfig(modulePath: RelativeModulePath): FlumeComponentConfig = {
    val group = cloudera.getRoleGroup(modulePath)
    val config = cloudera.getRoleGroupConfig(modulePath)
    toAgentConfig(group.title, values(config), group.isBase)
  }

  override def getPipelineConfig(modulePath: RelativeModulePath): String = {
    val group = cloudera.getRoleGroup(modulePath)
    val config = values(group.config)
    config(keyConfigFile)
  }

  override def updateComponentConfig(modulePath: RelativeModulePath, config: FlumeComponentUpdate) = {
    config.name match {
      case Some(name) =>
        val group = ClouderaRoleGroup(modulePath.moduleId, name, toClouderaConfig(config))
        cloudera.updateRoleGroup(modulePath, group)
      case None =>
        cloudera.updateRoleGroupConfig(modulePath.getServicePath, modulePath.moduleId, toClouderaConfig(config))
    }
  }

  override def updatePiplelineConfig(modulePath: RelativeModulePath, textConfig: String) = {
    cloudera.updateRoleGroupConfig(modulePath.getServicePath, modulePath.moduleId, toClouderaConfig(textConfig))
  }

  override def deleteComponent(modulePath: RelativeModulePath) = {
    cloudera.deleteRoleGroup(modulePath)
  }

  override def getInstances(modulePath: RelativeModulePath): AgentInstancesData = {
    val roles = cloudera.getRoles(modulePath)
    val hostMap = cloudera.getHosts(modulePath.clusterId).map(h => h.hostId -> h).toMap

    val instances = roles map { role =>
      val host = toPlatformHost(hostMap(role.hostId))
      toAgentInstance(role, modulePath, Some(host))
    }
    val available = (hostMap -- roles.map(_.hostId)).values map toPlatformHost

    AgentInstancesData(instances, available.toList)
  }

  override def createInstance(modulePath: RelativeModulePath, hostId: String): AgentInstance = {
    toAgentInstance(cloudera.createRole(modulePath, hostId), modulePath)
  }

  override def getInstance(modulePath: RelativeModulePath, instanceId: String): AgentInstance = {
    toAgentInstance(cloudera.getRole(modulePath, instanceId), modulePath)
  }

  override def getInstancePipelineConfig(modulePath: RelativeModulePath, instanceId: String): String = {
    val roleConfig = cloudera.getRole(modulePath, instanceId).config
    lazy val groupConfig = cloudera.getRoleGroup(modulePath).config
    val config = values(roleConfig, groupConfig)
    config(keyConfigFile)
  }

  override def updateInstanceComponentConfig(modulePath: RelativeModulePath, instanceId: String, config: FlumeComponentUpdate) = {
    cloudera.updateRoleConfig(modulePath, instanceId, toClouderaConfig(config))
  }

  override def updateInstancePipelineConfig(modulePath: RelativeModulePath, instanceId: String, textConfig: String) = {
    cloudera.updateRoleConfig(modulePath, instanceId, toClouderaConfig(textConfig))
  }

  override def deleteInstance(modulePath: RelativeModulePath, roleId: String) = {
    cloudera.deleteRole(modulePath, roleId)
  }

  override def startAgentInstance(modulePath: RelativeModulePath, instanceId: String): AgentInstance = {
    toAgentInstance(cloudera.startRole(modulePath, instanceId), modulePath)
  }

  override def stopAgentInstance(modulePath: RelativeModulePath, instanceId: String): AgentInstance = {
    toAgentInstance(cloudera.stopRole(modulePath, instanceId), modulePath)
  }

  private def toAgentConfig(name: String, config: String => String, isBase: Boolean = false): FlumeComponentConfig = {
    val agentName = config(keyAgentName)
    val pluginDir = config(keyPluginDirs) split ":" head

    FlumeComponentConfig(name, agentName, pluginDir, isBase)
  }

  private def toClouderaConfig(config: FlumeComponentUpdate): Map[String, ClouderaConfigItem] = {
    val agentNameMapping = config.agentName map (agentName => keyAgentName -> ClouderaConfigItem(Some(agentName)))
    val pluginDirMapping = config.pluginDir map (pluginDir => keyPluginDirs -> ClouderaConfigItem(Some(pluginDir)))

    (agentNameMapping.toList ++ pluginDirMapping) toMap
  }

  private def toClouderaConfig(textConfig: String): Map[String, ClouderaConfigItem] = {
    Map(keyConfigFile -> ClouderaConfigItem(Some(textConfig)))
  }

  private def toAgentInstance(role: ClouderaRole, modulePath: RelativeModulePath, resolvedHost: Option[PlatformHost] = None): AgentInstance = {
    val host = resolvedHost getOrElse toPlatformHost(cloudera.findHost(role.hostId))

    val state = role.state match {
      case ClouderaInstanceStarted => InstanceState.STARTED
      case ClouderaInstanceStopped => InstanceState.STOPPED
      case ClouderaInstanceBusy => InstanceState.BUSY
      case ClouderaInstanceUnknown => InstanceState.UNKNOWN
    }

    val health = role.health match {
      case ClouderaHealthGood => InstanceHealth.GOOD
      case ClouderaHealthBad => InstanceHealth.BAD
      case ClouderaHealthConcerning => InstanceHealth.CONCERNING
      case ClouderaHealthUnknown => InstanceHealth.UNKNOWN
    }

    val roleConfig = cloudera.getRoleConfig(modulePath, role.id)
    lazy val groupConfig = cloudera.getRoleGroupConfig(modulePath)
    val agentConfig = toAgentConfig("", values(roleConfig, groupConfig))

    AgentInstance(role.id, host, state, health, role.isStale, agentConfig)
  }

  private def values(map: Map[String, ClouderaConfigItem],
                    fallback: Map[String, ClouderaConfigItem] = Map.empty): String => String = { key: String =>
    val item = map get key
    val fitem = fallback get key

    item.flatMap(_.value) orElse fitem.flatMap(_.value) orElse item.flatMap(_.default) orElse fitem.flatMap(_.default) getOrElse ""
  }

  private def toPlatformHost(host: ClouderaHost): PlatformHost = {
    PlatformHost(host.hostId, host.ipAddress, host.hostname)
  }
}
