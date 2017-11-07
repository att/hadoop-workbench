package com.directv.hw.web.listing.plugin

import com.directv.hw.common.web.CommonJsonFormats
import com.directv.hw.core.access.SrvUser
import com.directv.hw.hadoop.access._
import com.directv.hw.hadoop.cluster.ConfigUpdate
import com.directv.hw.hadoop.hdfs.model.HdfsAccessInfo
import com.directv.hw.hadoop.host.model.PlatformHostAccess
import com.directv.hw.hadoop.oozie.model.OozieAccessInfo
import com.directv.hw.hadoop.platform.model._
import com.directv.hw.web.listing.model._
import com.directv.hw.web.platform.PlatformCommonJsonFormats
import spray.json._

trait PlatformJsonFormats extends CommonJsonFormats with PlatformCommonJsonFormats {

  implicit val serviceInfoFormat = jsonFormat3(ServiceInfo)
  implicit val serviceListFormat = jsonFormat1(ServiceList)
  implicit val clusterInfoFormat = jsonFormat4(ClusterInfo)
  implicit val oozieAccessInfoUpdateFormat = jsonFormat1(OozieAccessInfo)
  implicit val hdfsAccessInfoUpdateFormat = jsonFormat1(HdfsAccessInfo)
  implicit val customClusterPropertyFormat = jsonFormat3(CustomClusterProperty)
  implicit val customClusterPropertiesFormat = jsonFormat1(CustomProperties)
  implicit val clusterSettingsFormat = jsonFormat2(ClusterSettings)
  implicit val oozieJobIndexingInfoFormat = jsonFormat2(WebOozieJobIndexingInfo)
  implicit val configUpdateFormat = jsonFormat2(ConfigUpdate)
  implicit val fullClusterInfoFormat = jsonFormat5(FullClusterInfo)
  implicit val clusterListFormat = jsonFormat2(ClusterList)
  implicit val platformWithClustersFormat = jsonFormat3(PlatformWithClusters)
  implicit val flatClusterListFormat = jsonFormat1(FlatClusterList)
  implicit val serviceTypeFormat = jsonFormat3(ServiceType)
  implicit val serviceTypeListFormat = jsonFormat1(ServiceTypeList)
  implicit val fullAgentInfoFormat = jsonFormat8(FullAgentInfo)
  implicit val fullWorkflowInfoFormat = jsonFormat8(FullWorkflowInfo)
  implicit val serviceUserFormat = jsonFormat8(SrvUser)
  implicit val serviceUsersFormat = jsonFormat1(ServiceUsers)
  implicit val createdWebServiceUserFormat = jsonFormat1(CreatedWebServiceUser)
  implicit val webSshUserFormat = jsonFormat4(WebSshUser)
  implicit val webSshUsersFormat = jsonFormat1(WebSshUsers)
  implicit val createdWebSshUserFormat = jsonFormat1(CreatedWebSshUser)
  implicit val krbCredsFormat = jsonFormat2(CreateKeyFile)
  implicit val keyFileId = jsonFormat1(KeyFileId)
  implicit val indexationStatus = jsonFormat1(IndexationStatus)
  implicit val platformListFormat = jsonFormat1(PlatformList)
  implicit val clusterInstallation = jsonFormat9(ClusterInstallation)
  implicit val clusterEnvironments = jsonFormat1(ClusterEnvironments)


  implicit object FullModuleInfoFormat extends RootJsonFormat[FullModuleInfo] {
    def write(x: FullModuleInfo) = x match {
      case fullAgentInfo: FullAgentInfo => fullAgentInfoFormat.write(fullAgentInfo)
      case fullWorkflowInfo: FullWorkflowInfo => fullWorkflowInfoFormat.write(fullWorkflowInfo)
    }

    def read(value: JsValue) = value match {
      case _ => throw new IllegalArgumentException("not supported")
    }
  }

  implicit val fullModuleListFormat = jsonFormat1(FullModuleList)

  implicit val apiFormat = jsonFormat8(Api)
  implicit val platformFormat = jsonFormat7(Platform)
  implicit val fullPlatformListFormat = jsonFormat1(FullPlatformList)
  implicit val createdPlatformResponseFormat = jsonFormat1(CreatedPlatformResponse)

  implicit val platformAccessFormat = jsonFormat6(PlatformHostAccess)
  implicit val shortPlatformAccessFormat = jsonFormat1(ShortWebHostAccess)

  implicit val webPlatformInfoFormat = jsonFormat4(WebPlatformInfo)
  implicit val webAdminPlatformFormat = jsonFormat4(AdminPlatform)
  implicit val webAdminPlatformsFormat = jsonFormat1(AdminPlatforms)

  implicit val keyFileUpdateFormat = jsonFormat2(KeyFileInfo)
  implicit val keyFileFormat = jsonFormat2(KeyFileWO)
  implicit val keyFileListFormat = jsonFormat1(KeyFileListWO)
  implicit val createdKeyFileFormat = jsonFormat1(CreatedKeyFile)
}
