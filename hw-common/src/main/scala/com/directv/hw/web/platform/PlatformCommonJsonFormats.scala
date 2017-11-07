package com.directv.hw.web.platform

import com.directv.hw.common.web.CommonJsonFormats
import com.directv.hw.hadoop.platform.model.status._
import com.directv.hw.web.platform.model._
import spray.json.{JsValue, RootJsonFormat}

trait PlatformCommonJsonFormats extends CommonJsonFormats {

  implicit val statusFormat = enumFormat(PlatformStatuses)
  implicit val platformStatusRespFormat = jsonFormat4(PlatformStatusResp)
  implicit val platformListRespFormat = jsonFormat2(PlatformListResp)
  implicit val propertyFormat = enumFormat(PlatformProperties)
  implicit val propertyPairFormat = jsonFormat2(PropertyPair)
  implicit val platformUpdateFormat = jsonFormat3(PlatformUpdateResp)
  implicit val processFormat = enumFormat(PlatformProcessStatuses)
  implicit val platformProcessingFormat = jsonFormat5(PlatformProcessResp)
  implicit val indexationStatusFormat = jsonFormat3(IndexationStatus)
  implicit val clusterStatusFormat = jsonFormat5(ClusterStatusResp)

  implicit object StatusMessageDataFormat extends RootJsonFormat[PlatformStatusMessage] {
    override def write(x: PlatformStatusMessage): JsValue = {
      x match {
        case o: PlatformStatusResp => platformStatusRespFormat.write(o)
        case o: PlatformListResp => platformListRespFormat.write(o)
        case o: PlatformUpdateResp => platformUpdateFormat.write(o)
        case o: PlatformProcessResp => platformProcessingFormat.write(o)
        case o: ClusterStatusResp => clusterStatusFormat.write(o)
      }
    }

    override def read(json: JsValue): PlatformStatusMessage = {
      throw new IllegalArgumentException(s"can not parse value - ${json.toString}")
    }
  }

  def convertToMessage(status: PlatformStatus, platformId: Int): PlatformStatusMessage = {
    status match {
      case ProvisionInProgress(progress) => PlatformProcessResp(platformId, PlatformProcessStatuses.provisioning, progress)
      case ProvisionError(message) => PlatformStatusResp(platformId, PlatformStatuses.error, message = Some(s"Provisioning error: $message"))
      case ProvisionUnknown => PlatformStatusResp(platformId, PlatformStatuses.unknown)
      case DestroyInProgress(progress) => PlatformProcessResp(platformId, PlatformProcessStatuses.destroying, progress)
      case DestroySuccess => PlatformStatusResp(platformId, PlatformStatuses.destroyed)
      case DestroyError(message) => PlatformStatusResp(platformId, PlatformStatuses.error, message = Some(s"Provision destroy error: $message"))
      case Online(_) => PlatformStatusResp(platformId, PlatformStatuses.online)
      case Offline(_) => PlatformStatusResp(platformId, PlatformStatuses.offline)
      case ErrorStatus(message) => PlatformStatusResp(platformId, PlatformStatuses.error, message = Some(message))
      case UnknownStatus(message) => PlatformStatusResp(platformId, PlatformStatuses.unknown, message = Some(message))
    }
  }
}
