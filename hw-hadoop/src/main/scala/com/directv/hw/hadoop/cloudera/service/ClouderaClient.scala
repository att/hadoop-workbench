package com.directv.hw.hadoop.cloudera.service

import com.directv.hw.hadoop.cloudera.model._
import com.directv.hw.hadoop.model.{RelativeModulePath, RelativeServicePath}
import com.directv.hw.hadoop.platform.model.BasicOozieServiceInfo

trait ClouderaClient {

  def getClusters: List[ClouderaCluster]
  def getServices(clusterId: String): List[ClouderaServiceInfo]

  def getRoleGroups(servicePath: RelativeServicePath): List[ClouderaRoleGroup]
  def getRoleGroup(modulePath: RelativeModulePath): ClouderaRoleGroup
  def getRoleGroupConfig(modulePath: RelativeModulePath): Map[String, ClouderaConfigItem]
  def createRoleGroup(servicePath: RelativeServicePath, group: ClouderaRoleGroup)
  def updateRoleGroup(servicePath: RelativeServicePath, group: ClouderaRoleGroup)
  def updateRoleGroupConfig(servicePath: RelativeServicePath, groupId: String, config: Map[String, ClouderaConfigItem])
  def deleteRoleGroup(modulePath: RelativeModulePath)

  def getRoles(modulePath: RelativeModulePath): List[ClouderaRole]
  def getRole(modulePath: RelativeModulePath, roleId: String): ClouderaRole
  def getRoleConfig(modulePath: RelativeModulePath, roleId: String): Map[String, ClouderaConfigItem]
  def createRole(modulePath: RelativeModulePath, hostId: String): ClouderaRole
  def updateRoleConfig(modulePath: RelativeModulePath, roleId: String, config: Map[String, ClouderaConfigItem])
  def deleteRole(modulePath: RelativeModulePath, roleId: String)
  def startRole(modulePath: RelativeModulePath, roleId: String): ClouderaRole
  def stopRole(modulePath: RelativeModulePath, roleId: String): ClouderaRole

  def getHosts(clusterId: String): List[ClouderaHost]
  def findHost(hostId: String): ClouderaHost

  def getActiveNameNode(clusterId: String): Option[ClouderaHdfsHost]
  def getActiveJobTrackerHttpHost(clusterId: String): Option[ClouderaServiceHost]
  def getActiveResourceManagerHttpHost(clusterId: String): Option[ClouderaServiceHost]

  def getOozieShareLibPath(clusterId: String): String
  def getOozieServiceInfo(clusterId: String): BasicOozieServiceInfo
  def getZookeeperQuorum(clusterId: String): List[ClouderaServiceHost]
  def getHiveMetastore(clusterId: String): ClouderaHiveMetastore

  def retrieveClientConfigs(clusterId: String): List[Array[Byte]]
}
