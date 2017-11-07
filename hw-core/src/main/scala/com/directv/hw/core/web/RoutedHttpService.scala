package com.directv.hw.core.web

import akka.actor._
import com.directv.hw.common.web.{ErrorResponse, WebMarshallers}
import com.directv.hw.core.exception._
import com.directv.hw.hadoop.http.client.BadResponseException
import com.typesafe.scalalogging.LazyLogging
import spray.http.StatusCodes
import spray.httpx.marshalling.ToResponseMarshallable
import spray.routing._
import spray.util.LoggingContext

class RoutedHttpService(route: Route) extends Actor with HttpService
  with AppJsonFormats with WebMarshallers with LazyLogging {

  implicit val handler = ExceptionHandler {
    case ex: Throwable => ctx => { ctx.complete(makeResponse(ex)) }
  }

  implicit def actorRefFactory: ActorContext = context

  def receive: Receive =
    runRoute(route)(handler, RejectionHandler.Default, context, RoutingSettings.default, LoggingContext.fromActorRefFactory)

  private def makeResponse(ex: Throwable): ToResponseMarshallable = {
    logger.error("Error processing request", ex)
    ex match {
      case e: ServerError => StatusCodes.BadRequest -> ErrorResponse(e.getMessage, e.errorType.map(_.code))
      case e: DapException => StatusCodes.InternalServerError -> ErrorResponse(e.getMessage, e.errorType.map (_.code))
      case e: NotSupportedException => StatusCodes.BadRequest -> ErrorResponse(s"Invalid request: [${e.getMessage}]")
      case e: NotFoundException => StatusCodes.NotFound -> ErrorResponse(e.getMessage)
      case BadResponseException(code, reason) if code == 404 => StatusCodes.NotFound -> ErrorResponse(reason)
      case AuthenticationException(message, cause) => StatusCodes.Unauthorized -> ErrorResponse(message)
      case e: Throwable => StatusCodes.InternalServerError -> ErrorResponse(s"Server error: [${e.getMessage}]")
    }
  }
}
