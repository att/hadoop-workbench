package com.directv.hw.hadoop.hortonworks.client

import akka.http.scaladsl.model._
import akka.http.scaladsl.model.headers.{Authorization, BasicHttpCredentials}
import com.directv.hw.hadoop.hortonworks.client.exception.{ComponentAlreadyExists, HdpClientException}
import com.directv.hw.hadoop.http.client.{BadResponseException, HttpClientResponse, HttpDispatcher}
import com.directv.hw.hadoop.model.RelativeModulePath
import com.typesafe.scalalogging.LazyLogging
import spray.json._
import scala.concurrent.{ExecutionContext, Future}
import scala.util.{Failure, Success}

class HdpClientImpl(http: HttpDispatcher)(implicit dispatcher: ExecutionContext)
  extends HortonWorksClient with LazyLogging with HdpJsonFormats {

  private val v1Api: String = "/api/v1"

  override def getClusters(conn: ConnectionInfo): Future[Clusters] = {
    val context = v1Api + "/clusters?fields=Clusters/cluster_id&Clusters/cluster_name"
    dispatchRq[Clusters](HttpMethods.GET, conn, context).map(_.body.get)
  }

  override def getHosts(clusterId: String, conn: ConnectionInfo): Future[Hosts] = {
    val context = v1Api + s"/clusters/$clusterId/hosts?fields=Hosts/host_name,Hosts/ip"
    dispatchRq[Hosts](HttpMethods.GET, conn, context).map(_.body.get)
  }

  override def getHost(clusterId: String, hostId: String)(implicit conn: ConnectionInfo): Future[Host] = {
    val context = s"$v1Api/hosts?fields=Hosts/host_name,Hosts/ip&Hosts/cluster_name=$clusterId&Hosts/host_name=$hostId"
    dispatchRq[Hosts](HttpMethods.GET, conn, context).map(_.body.get.items.head.Hosts)
  }

  override def getServices(clusterId: String, conn: ConnectionInfo): Future[Services] = {
    val context = v1Api + s"/clusters/$clusterId/services/?fields=ServiceInfo/service_name"
    dispatchRq[Services](HttpMethods.GET, conn, context).map(_.body.get)
  }

  override def getComponentState(modulePath: RelativeModulePath, conn: ConnectionInfo): Future[ServiceComponentWrapper] = {
    val context = s"$v1Api/clusters/${modulePath.clusterId}/services/${modulePath.serviceId}" +
      s"/components/${modulePath.moduleId}?fields=ServiceComponentInfo/state"

    dispatchRq[ServiceComponentWrapper](HttpMethods.GET, conn, context).map(_.body.get)
  }

  override def updateHostComponentState(clusterId: String,
                                        hostId: String,
                                        componentId: String,
                                        state: String)(implicit conn: ConnectionInfo): Future[Option[AnyResponse]] = {

    val url = s"$v1Api/clusters/$clusterId/hosts/$hostId/host_components/$componentId"
    val rq = ComponentUpdateWrapper(ComponentUpdate(state))
    dispatchRq[AnyResponse](HttpMethods.PUT, conn, url, HttpEntity(rq.toJson.toString())).map(_.body)
  }

  override def createConfigGroup(clusterId: String, configGroup: ConfigGroupWrapper, conn: ConnectionInfo): Future[CreateConfigGroupResponse] = {
    val url = s"$v1Api/clusters/$clusterId/config_groups/"

    val exceptionHandler: PartialFunction[Throwable, Throwable] = {
      case e: BadResponseException if e.code == StatusCodes.Conflict.intValue =>
        ComponentAlreadyExists(configGroup.ConfigGroup.group_name)
    }

    dispatchRq[CreateConfigGroupResponse](
      HttpMethods.POST, conn, url,
      HttpEntity(configGroup.toJson.toString()),
      exceptionHandler
    ).map(_.body.get)
  }

  override def getConfigGroups(clusterId: String,
                               serviceId: String,
                               hostId: Option[String] = None,
                               conn: ConnectionInfo): Future[GetGroupConfigsResponse] = {

    val url = s"$v1Api/clusters/$clusterId/config_groups?fields=ConfigGroup&ConfigGroup/tag=$serviceId" +
    hostId.map("&ConfigGroup/hosts/host_name=" + _).getOrElse("")
    dispatchRq[GetGroupConfigsResponse](HttpMethods.GET, conn, url).map(_.body.get)
  }

  override def getCurrentConfigurations(clusterId: String,
                                        serviceType: String,
                                        groupId: String,
                                        conn: ConnectionInfo): Future[ClusterConfigurations] = {

    val url = s"$v1Api/clusters/$clusterId/configurations/service_config_versions"
    val params = s"?service_name=$serviceType&group_id=$groupId&is_current=true"
    dispatchRq[ClusterConfigurations](HttpMethods.GET, conn, url + params) map (_.body.get)
  }

  override def getConfigGroup(clusterId: String, groupId: String, conn: ConnectionInfo): Future[ConfigGroupWrapper] = {
    val url = s"$v1Api/clusters/$clusterId/config_groups/$groupId"
    dispatchRq[ConfigGroupWrapper](HttpMethods.GET, conn, url) map (_.body.get)
  }

  override def updateConfigGroup(configGroup: ConfigGroup)(implicit conn: ConnectionInfo): Future[Option[AnyResponse]] = {

    val clusterId = configGroup.cluster_name
    val groupId = configGroup.id.get
    val url = s"$v1Api/clusters/$clusterId/config_groups/$groupId"
    dispatchRq[AnyResponse](HttpMethods.PUT, conn, url,
      HttpEntity(ConfigGroupWrapper(configGroup).toJson.toString())).map(_.body)
  }

  override def deleteConfigGroup(clusterId: String, groupId: Int, conn: ConnectionInfo): Future[Option[AnyResponse]] = {
    val url = s"$v1Api/clusters/$clusterId/config_groups/$groupId"
    dispatchRq[AnyResponse](HttpMethods.DELETE, conn, url).map(_.body)
  }

  override def getCurrentServiceConfiguration(clusterId: String,
                                              serviceId: String,
                                              isDefault: Boolean,
                                              conn: ConnectionInfo): Future[ClusterConfigurations] = {

    val baseUrl = s"$v1Api/clusters/$clusterId/configurations/service_config_versions" +
      s"?service_name=$serviceId&is_current=true"

    val url = if (isDefault) baseUrl + "&group_id=-1&group_name=default" else baseUrl
    dispatchRq[ClusterConfigurations](HttpMethods.GET, conn, url).map(_.body.get)
  }

  override def getServiceConfig(clusterId: String, serviceId: String, conn: ConnectionInfo): Future[Array[Byte]] = {
    val str = serviceId + "_CLIENT"
    val url = conn.url + s"$v1Api/clusters/$clusterId/services/$serviceId/components/$str?format=client_config_tar"
    val headers = List(Authorization(BasicHttpCredentials(conn.user, conn.password)))
    http.submitRequest(HttpMethods.GET, url, headers).map {
      case Success(resp) => resp.body
      case Failure(e) => throw HdpClientException(s"Couldn't download config for $serviceId service", e)
    }
  }

  override def getHostComponent(clusterId: String, hostId: String, componentId: String)
                               (implicit conn: ConnectionInfo): Future[Component] = {

    val url = s"$v1Api/clusters/$clusterId/hosts/$hostId/host_components/$componentId"
    dispatchRq[ComponentWrapper](HttpMethods.GET, conn, url).map(_.body.get.HostRoles)
  }

  def getHostComponentConfigs(clusterId: String, hostId: String, componentId: String)
                             (implicit conn: ConnectionInfo): Future[Map[String, ConfigVersion]] = {

    val url = s"$v1Api/clusters/$clusterId/hosts/$hostId/host_components/$componentId?fields=HostRoles/actual_configs"
    dispatchRq[HostComponentConfigs](HttpMethods.GET, conn, url).map(_.body.get.HostRoles.actual_configs)
  }

  override def getHostNamenodeMetrics(clusterId: String, hostId: String, componentId: String)
                               (implicit conn: ConnectionInfo): Future[Option[NamenodeMetrics]] = {

    val url = s"$v1Api/clusters/$clusterId/hosts/$hostId/host_components/$componentId?fields=metrics"
    dispatchRq[NamenodeWithMetrics](HttpMethods.GET, conn, url).map(_.body.get.metrics)
  }

  override def getResourceManagerHostRoles(clusterId: String, hostId: String, componentId: String)
                                          (implicit conn: ConnectionInfo): Future[ResourceManagerRoles] = {

    val url = s"$v1Api/clusters/$clusterId/hosts/$hostId/host_components/$componentId?fields=HostRoles"
    dispatchRq[ResourceManagerWithRoles](HttpMethods.GET, conn, url).map(_.body.get.HostRoles)
  }

  override def getComponentHosts(clusterId: String, serviceId: String, componentId: String)
                                (implicit conn: ConnectionInfo): Future[List[HostComponent]] = {

    val url = s"$v1Api/clusters/$clusterId/services/$serviceId/components/$componentId?fields=host_components"
    dispatchRq[ServiceComponents](HttpMethods.GET, conn, url).map(_.body.get.host_components.map(_.HostRoles))
  }

  def getServiceConfiguration(clusterId: String, configType: String, configVersion: String)
                             (implicit conn: ConnectionInfo): Future[ServiceConfiguration] = {

    val url = s"$v1Api/clusters/$clusterId/configurations?type=$configType&tag=$configVersion"
    dispatchRq[ServiceConfigurations](HttpMethods.GET, conn, url).map(_.body.get.items.head)
  }

  private val defaultExceptionHandler: PartialFunction[Throwable, Throwable] = {
    case e: Exception => throw HdpClientException(e.getMessage, e)
    case e => throw e
  }

  private def dispatchRq[T: JsonReader](method: HttpMethod, conn: ConnectionInfo,
                                        context: String, body: RequestEntity = HttpEntity.Empty,
                                        exceptionHandler: PartialFunction[Throwable, Throwable] =
                                         defaultExceptionHandler): Future[HttpClientResponse[Option[T]]] = {
    val url = conn.url + context
    val headers = List(Authorization(BasicHttpCredentials(conn.user, conn.password)))
    http.submitRequest(method, url, headers, body).map {
      case Success(resp) => HttpClientResponse(resp.status, convertBody[T](resp.body), resp.headers)
      case Failure(e) => throw exceptionHandler.orElse(defaultExceptionHandler)(e)
    }
  }

  private def convertBody[T: JsonReader](body: Array[Byte]): Option[T] = {
    val text = new String(body)
    try {
      if (text.isEmpty) None
      else Some(text.parseJson.convertTo[T])
    } catch {
      case _: JsonParser.ParsingException => throw HdpClientException("Unknown HDP response - " + text)
    }
  }
}
