package com.directv.hw.common.web

import java.io.InputStream

case class SuccessResponse[T](data: T)
case class ErrorResponse(message: String, errorType: Option[String] = None)
case class WebMessage(message: String)
case class EmptyResponse(warnings: List[WebMessage])
case class StreamEntity(items: List[InputStream])
case class CopyFilesToPlatform(platformId: Int,
                               clusterId: String,
                               serviceId: String,
                               moduleId: String,
                               files: List[String])

case class CopyFilesToTenant(templateId: Int, files: List[String])