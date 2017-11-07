package com.directv.hw.hadoop.hortonworks.client

import com.directv.hw.core.exception.NotSupportedException
import spray.httpx.SprayJsonSupport
import spray.httpx.marshalling.MetaMarshallers
import spray.json.{DefaultJsonProtocol, DeserializationException, JsValue, RootJsonFormat}

import scala.collection.immutable.HashMap

trait HdpJsonFormats extends DefaultJsonProtocol with MetaMarshallers {

  implicit val clusterFormat = jsonFormat3(Cluster)
  implicit val hortonWorksClusterFormat = jsonFormat2(ClusterWrapper)
  implicit val hortonWorksClustersFormat = jsonFormat2(Clusters)
  implicit val hostsFormat = jsonFormat3(Host)
  implicit val hortonWorksHostFormat = jsonFormat2(HostWrapper)
  implicit val hortonWorksHostsFormat = jsonFormat2(Hosts)
  implicit val configFormat = jsonFormat2(Config)
  implicit val hortonWorksConfigurationFormat = jsonFormat6(Configuration)
  implicit val hortonWorksClusterConfigurationFormat = jsonFormat3(ClusterConfigurationWrapper)
  implicit val hortonWorksClusterConfigurationsFormat = jsonFormat2(ClusterConfigurations)
  implicit val serviceInfoFormat = jsonFormat3(Service)
  implicit val hortonWorksServiceFormat = jsonFormat2(ServiceWrapper)
  implicit val hortonWorksServicesInfoFormat = jsonFormat2(Services)
  implicit val hwDesiredConfigFormat = jsonFormat4(DesiredConfig)
  implicit val hostConfigGroupFormat = jsonFormat2(HostConfigGroup)
  implicit val configGroupFormat = jsonFormat7(ConfigGroup)
  implicit val hwConfigGroupFormat = jsonFormat1(ConfigGroupWrapper)
  implicit val getGroupConfigsResponseFormat = jsonFormat2(GetGroupConfigsResponse)
  implicit val serviceComponentInfoFormat = jsonFormat4(ServiceComponent)
  implicit val componentStateResultFormat = jsonFormat2(ServiceComponentWrapper)
  implicit val сomponentStateFormat = jsonFormat2(Component)
  implicit val сomponentStateWrapperFormat = jsonFormat2(ComponentWrapper)
  implicit val configVersionFormat = jsonFormat2(ConfigVersion)
  implicit val hostRolesConfigsFormat = jsonFormat1(HostRolesConfigs)
  implicit val hostComponentConfigsFormat = jsonFormat1(HostComponentConfigs)
  implicit val hostComponentFormat = jsonFormat3(HostComponent)
  implicit val рostComponentWrapperFormat = jsonFormat1(HostComponentWrapper)
  implicit val serviceComponentFormat = jsonFormat1(ServiceComponents)
  implicit val componentUpdateFormat = jsonFormat1(ComponentUpdate)
  implicit val componentUpdateWrapperFormat = jsonFormat1(ComponentUpdateWrapper)
  implicit val createConfigGroupFormat = jsonFormat1(CreateConfigGroup)
  implicit val createConfigGroupWrapperFormat = jsonFormat2(CreateConfigGroupWrapper)
  implicit val createConfigGroupResponseFormat = jsonFormat1(CreateConfigGroupResponse)
  implicit val serviceConfigurationFormat = jsonFormat1(ServiceConfiguration)
  implicit val serviceConfigurationsFormat = jsonFormat1(ServiceConfigurations)
  implicit val resourceManagerRolesFormat = jsonFormat1(ResourceManagerRoles)
  implicit val resourceManagerWithRolesFormat = jsonFormat1(ResourceManagerWithRoles)

  implicit object DfsFormat extends RootJsonFormat[Dfs] {
    override def read(json: JsValue): Dfs = {

      val config = try {
        Some (
          json.asJsObject.fields("FSNamesystem").asJsObject.fields match {
            case props: HashMap[String, JsValue] => props
            case unknown => throw new DeserializationException("unknown field in Dfs object" + unknown)
          }
        )
      } catch {
        case e: NoSuchElementException => None
      }

      val stringProps = config.map { _.map { entry => (entry._1, entry._2.toString().replace("\"", "")) } }


      Dfs(stringProps)
    }

    def write(x: Dfs) = throw new NotSupportedException
  }

  implicit val dfsFormat = jsonFormat1(Dfs)
  implicit val namenodeMetricsFormat = jsonFormat1(NamenodeMetrics)
  implicit val namenodeWithMetricsFormat = jsonFormat1(NamenodeWithMetrics)



  implicit object AnyResponseFormat extends RootJsonFormat[AnyResponse] {
    override def read(json: JsValue): AnyResponse = AnyResponse()
    def write(x: AnyResponse) = throw new NotSupportedException
  }
}
