package com.directv.hw.common.web

import com.directv.hw.core.exception.ServerError
import com.directv.hw.core.log.{DebugLevel, InfoLevel}
import spray.http.HttpHeaders.Host
import spray.http._
import spray.httpx.unmarshalling._
import spray.json.JsonReader
import spray.routing._
import spray.json._
import scala.language.{implicitConversions, postfixOps}


trait WebCommon extends CommonJsonFormats with Directives with WebMarshallers {

  def decode(urlPart: String): String = java.net.URLDecoder.decode(urlPart, "UTF-8")

  def ensureEntity[T](routeForEntity: T => Route)(implicit um: FromRequestUnmarshaller[T]): Route = {
    entity(as[T])(routeForEntity) ~ complete(throw new ServerError(s"Could not parse request entity"))
  }

  def jsonEntity[T: JsonReader](routeForEntity: T => Route)(implicit um: FromRequestUnmarshaller[T]) = {
    extract(_.request.entity.asString) { json =>
      val entity = json.parseJson.convertTo[T]
      routeForEntity(entity)
    }
  }

  val badRouteError: Route = {
    complete(throw new ServerError("Bad route: request path is unknown"))
  }

  def completeJsonResponse(jsonText: String): Route = complete(jsonText.parseJson)

  def completeWithAudit[T](user: String, op: String, details: String = "")(response: => T)
                          (implicit marshaller: AuditMarshaller[T, InfoLevel]) = {

    complete(marshaller(user, op, details, response))
  }

  def completeWithDebugAudit[T](user: String, op: String, details: String = "")(response: => T)
                               (implicit marshaller: AuditMarshaller[T, DebugLevel]) = {

    complete(marshaller(user, op, details, response))
  }

  private def hostnameExtractor: PartialFunction[HttpHeader, String] = {
    case host: Host => host.host
  }
}

