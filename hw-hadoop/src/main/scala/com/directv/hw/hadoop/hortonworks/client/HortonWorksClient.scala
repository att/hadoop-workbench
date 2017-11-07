package com.directv.hw.hadoop.hortonworks.client

import akka.util.ByteString
import com.directv.hw.hadoop.hortonworks.client.exception.ComponentAlreadyExists
import com.directv.hw.hadoop.model.RelativeModulePath
import scala.concurrent.Future

trait HortonWorksClient {
  def getClusters(conn: ConnectionInfo): Future[Clusters]
  def getHosts(clusterId: String, conn: ConnectionInfo): Future[Hosts]
  def getHost(clusterId: String, hostId: String)(implicit conn: ConnectionInfo): Future[Host]
  def getServices(clusterId: String, conn: ConnectionInfo): Future[Services]
  def getComponentState(modulePath: RelativeModulePath, conn: ConnectionInfo): Future[ServiceComponentWrapper]

  def updateHostComponentState(clusterId: String,
                               hostId: String,
                               componentId: String,

                               state: String)(implicit conn: ConnectionInfo): Future[Option[AnyResponse]]

  @throws[ComponentAlreadyExists]
  def createConfigGroup(clusterId: String, hwConfigGroup: ConfigGroupWrapper, conn: ConnectionInfo): Future[CreateConfigGroupResponse]
  def getConfigGroups(clusterId: String,
                      serviceId: String,
                      hostId: Option[String] = None,
                      conn: ConnectionInfo): Future[GetGroupConfigsResponse]

  def getCurrentConfigurations(clusterId: String,
                               serviceType: String,
                               groupId: String,
                               conn: ConnectionInfo): Future[ClusterConfigurations]

  def getConfigGroup(clusterId: String, groupId: String, conn: ConnectionInfo): Future[ConfigGroupWrapper]
  def updateConfigGroup(configGroup: ConfigGroup)
                       (implicit conn: ConnectionInfo): Future[Option[AnyResponse]]

  def deleteConfigGroup(clusterId: String, groupId: Int, conn: ConnectionInfo): Future[Option[AnyResponse]]

  def getCurrentServiceConfiguration(clusterId: String,
                                     serviceId: String,
                                     isDefault: Boolean,
                                     conn: ConnectionInfo): Future[ClusterConfigurations]

  def getServiceConfig(clusterId: String, serviceId: String, conn: ConnectionInfo): Future[Array[Byte]]

  def getHostComponent(clusterId: String, hostId: String, componentId: String)
                      (implicit conn: ConnectionInfo): Future[Component]

  def getComponentHosts(clusterId: String, serviceId: String, componentId: String)
                       (implicit conn: ConnectionInfo): Future[List[HostComponent]]

  def getHostNamenodeMetrics(clusterId: String, hostId: String, componentId: String)
                            (implicit conn: ConnectionInfo): Future[Option[NamenodeMetrics]]

  def getResourceManagerHostRoles(clusterId: String, hostId: String, componentId: String)
                                 (implicit conn: ConnectionInfo): Future[ResourceManagerRoles]

  def getHostComponentConfigs(clusterId: String, hostId: String, componentId: String)
                             (implicit conn: ConnectionInfo): Future[Map[String, ConfigVersion]]

  def getServiceConfiguration(clusterId: String, configType: String, configVersion: String)
                             (implicit conn: ConnectionInfo): Future[ServiceConfiguration]
}
