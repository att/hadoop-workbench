package com.directv.hw.web.listing.model

import com.directv.hw.core.access.SrvUser
import com.directv.hw.hadoop.access.CustomClusterProperty
import com.directv.hw.hadoop.cluster.ConfigUpdate
import com.directv.hw.hadoop.hdfs.model.HdfsAccessInfo
import com.directv.hw.hadoop.host.model.{FullHostAccess, HostAccess, PlatformHost, PlatformHostAccess}
import com.directv.hw.hadoop.oozie.model.OozieAccessInfo
import com.directv.hw.hadoop.platform.model._


case class ServiceTypeList(services: List[ServiceType])

case class ServiceList(services: List[ServiceInfo])

case class WebOozieJobIndexingInfo(isIndexing: Boolean, canIndex: Boolean)

case class FullClusterInfo(info: ClusterInfo,
                           hdfsAccess: Option[HdfsAccessInfo] = None,
                           oozieAccess: Option[OozieAccessInfo] = None,
                           customData: List[CustomClusterProperty] = List.empty,
                           configUpdate: Option[ConfigUpdate] = None)

case class CustomProperties(properties: List[CustomClusterProperty])

case class ClusterEnvironments(environments: List[String])

case class ClusterList(clusters: List[FullClusterInfo], isOnline: Boolean)

case class PlatformWithClusters(platform: PlatformInfo, clusters: List[FullClusterInfo], isOnline: Boolean)

case class FlatClusterList(platforms: List[PlatformWithClusters])

case class PlatformList(platforms: List[PlatformInfo])

case class FullModuleList(modules: List[FullModuleInfo])

case class FullPlatformList(platforms: List[Platform])

case class CreatedPlatformResponse(platformId: Int)

case class HostList(hosts: List[FullHostAccess])

case class FullPlatformHost(host: PlatformHost, access: Option[HostAccess])

case class FullPlatformHosts(hosts: List[FullPlatformHost])

case class ShortWebHostAccess(pluginDirs: List[String])

case class CreatedHostAccessRequest(id: Int)

case class KeyFileListWO(keys: List[KeyFileWO])

case class CreatedKeyFile(id: Int)

case class WebPlatformInfo(title: String, version: String, `type`: String, location: String)

case class AdminPlatform(id: Option[Int], info: WebPlatformInfo, apiAccess: Api, sshAccess: Option[PlatformHostAccess])

case class AdminPlatforms(platforms: List[AdminPlatform])

case class ServiceUsers(users: List[SrvUser])

case class CreatedWebServiceUser(id: Int)

case class WebSshUser(id: Option[Int], name: String, password: Option[String], keyId: Option[Int])

case class WebSshUsers(users: List[WebSshUser])

case class CreatedWebSshUser(id: Int)

case class IndexationStatus(status: String)

case class KeyFileWO(id: Option[Int], name: String)