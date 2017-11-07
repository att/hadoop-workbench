package com.directv.hw.hadoop.http.client

import akka.http.scaladsl.model._
import com.directv.hw.core.concurrent.DispatcherFactory
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}
import spray.json.{JsonParser, JsonReader}

import scala.concurrent.{ExecutionContext, Future}
import scala.util.{Failure, Success}
import spray.json._

abstract class HttpClientDispatcher(implicit injector: Injector) extends Injectable with LazyLogging {

  private val http = inject[HttpDispatcher]

  implicit val dispatcher: ExecutionContext = inject[DispatcherFactory].dispatcher

  protected val defaultExceptionHandler: PartialFunction[Throwable, Throwable] = {case e => throw e}

  protected def dispatchRawRq(method: HttpMethod, uri: Uri,
                              headers: List[HttpHeader] = List.empty,
                              body: RequestEntity = HttpEntity.Empty,
                              exceptionHandler: PartialFunction[Throwable, Throwable] =
                              defaultExceptionHandler): Future[HttpClientResponse[Option[String]]] = {

    def convertBody(body: String) = {
      if (body.isEmpty) None
      else Some(body)
    }

    sendRequest(method, uri, headers, body, exceptionHandler, convertBody)
  }

  protected def dispatchRq[T: JsonReader](method: HttpMethod, uri: Uri,
                                          headers: List[HttpHeader] = List.empty,
                                          body: RequestEntity = HttpEntity.Empty,
                                          exceptionHandler: PartialFunction[Throwable, Throwable] =
                                          defaultExceptionHandler): Future[HttpClientResponse[Option[T]]] = {

    def convertBody(body: String): Option[T] = {
      try {
        if (body.isEmpty) None
        else Some(body.parseJson.convertTo[T])
      } catch {
        case _: JsonParser.ParsingException => throw UnknownResponseException("unknown response:\n" + body)
      }
    }

    sendRequest(method, uri, headers, body, exceptionHandler, convertBody)
  }


  private def sendRequest[T](method: HttpMethod,
                             url: Uri,
                             headers: List[HttpHeader],
                             body: RequestEntity,
                             exceptionHandler: PartialFunction[Throwable, Throwable],
                             convert: String => Option[T]): Future[HttpClientResponse[Option[T]]]  = {

    http.submitRequest(method, url, headers, body).map {
      case Success(resp) => HttpClientResponse(resp.status, convert(new String(resp.body)), resp.headers)
      case Failure(e) => throw exceptionHandler.orElse(defaultExceptionHandler)(e)
    }
  }
}
