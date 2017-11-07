package com.directv.hw.hadoop.hortonworks.client

case class Cluster(cluster_id: Int, cluster_name: String, version: String)
case class ClusterWrapper(href: String, Clusters: Cluster)
case class Clusters(href: String, items: List[ClusterWrapper])

case class Host(cluster_name: String, host_name: String, ip: String)
case class HostWrapper(href: String, Hosts: Host)
case class Hosts(href: String, items: List[HostWrapper])


case class Config(cluster_name: String, stack_id: String)
case class Configuration(Config: Config,
                         `type`: String,
                         tag: String,
                         version: Int,
                         properties: Map[String, String],
                         href: Option[String] = None)
case class ClusterConfigurationWrapper(href: String, cluster_name: String, configurations: List[Configuration])
case class ClusterConfigurations(href: String, items: List[ClusterConfigurationWrapper])

case class Service(cluster_name: String, service_name: String, state: Option[String])
case class ServiceWrapper(href: String, ServiceInfo: Service)
case class Services(href: String, items: List[ServiceWrapper])


case class DesiredConfig(`type`: String,
                         tag: String,
                         properties: Option[Map[String, String]] = None,
                         href: Option[String] = None)

case class HostConfigGroup(href: Option[String] = None, host_name: String)
case class ConfigGroup(id: Option[Int],
                       group_name: String,
                       tag: String,
                       cluster_name: String,
                       hosts: List[HostConfigGroup] = List.empty,
                       desired_configs: List[DesiredConfig] = List.empty,
                       description: String = "")

case class ConfigGroupWrapper(ConfigGroup: ConfigGroup)

case class CreateConfigGroup(id: Int)
case class CreateConfigGroupWrapper(href: String, ConfigGroup: CreateConfigGroup)
case class CreateConfigGroupResponse(resources: List[CreateConfigGroupWrapper])

case class GetGroupConfigsResponse(href: String, items: List[ConfigGroupWrapper])

case class Component(state: String, stale_configs: Boolean)
case class ComponentWrapper(href: String, HostRoles: Component)

case class Dfs(FSNamesystem: Option[Map[String, String]])
case class NamenodeMetrics(dfs: Dfs)
case class NamenodeWithMetrics(metrics: Option[NamenodeMetrics])

case class ResourceManagerRoles(ha_state: Option[String])
case class ResourceManagerWithRoles(HostRoles: ResourceManagerRoles)

case class ComponentUpdate(state: String)
case class ComponentUpdateWrapper(HostRoles: ComponentUpdate)

case class ConfigVersion(overrides: Option[Map[String, String]], default: String)
case class HostRolesConfigs(actual_configs: Map[String, ConfigVersion])
case class HostComponentConfigs(HostRoles: HostRolesConfigs)


case class ServiceConfiguration(properties: Map[String, String])
case class ServiceConfigurations(items: List[ServiceConfiguration])

case class HostComponent(cluster_name: String, component_name: String, host_name: String)
case class HostComponentWrapper(HostRoles: HostComponent)
case class ServiceComponents(host_components: List[HostComponentWrapper])

case class ServiceComponent(cluster_name: String, component_name: String, service_name: String, state: String)
case class ServiceComponentWrapper(href: String, ServiceComponentInfo: ServiceComponent)

case class AnyResponse()