package com.directv.hw.hadoop.http.client

import java.util.concurrent.{ConcurrentHashMap, TimeoutException}
import akka.util.ByteString
import akka.actor.ActorSystem
import akka.http.scaladsl.model._
import akka.http.scaladsl.model.headers._
import akka.stream.ActorMaterializer
import akka.stream.StreamTcpException
import akka.stream.scaladsl.{Sink, Source}
import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.core.http.RequestIdGenerator
import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.http.client
import com.directv.hw.hadoop.http.client.header.`X-Requested-By`
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}

import scala.concurrent.{ExecutionContext, Future}
import scala.concurrent.duration._
import scala.util.{Failure, Success, Try}
import scala.collection.JavaConversions._
import scala.language.postfixOps

class HttpDispatcherImpl(implicit inj: Injector) extends HttpDispatcher with Injectable with LazyLogging {

  implicit val system: ActorSystem = inject[ActorSystem]
  implicit val executionContext: ExecutionContext = inject[DispatcherFactory].dispatcher
  implicit val materializer: ActorMaterializer = inject[ActorMaterializer]

  private val poolClientFlow = inject[HttpPool].flow
  private val appConf = inject[AppConf]
  private val tokenGenerator = inject[SpNegoTokenGenerator]
  private val ongoingRequests = new ConcurrentHashMap[Long, (String, Long)]()
  private val idGenerator = inject[RequestIdGenerator]

  type RawResult = Future[(Try[HttpResponse], RequestContext)]
  type FinalResult[T] = Future[Try[HttpClientResponse[T]]]

  override def getOngoingRequests: List[(String, Long)] = {
    ongoingRequests.elements().toList
  }

  override def submitRequest(method: HttpMethod,
                             uri: Uri,
                             headers: List[HttpHeader],
                             body: MessageEntity,
                             spNegoContext: Option[KrbCredentials]): FinalResult[Array[Byte]] = {

    request(method, uri, headers, body, spNegoContext).flatMap(consumeStrict)
  }

  override def submitRequestWithRedirect(method: HttpMethod,
                                         uri: Uri,
                                         headers: List[HttpHeader] = List.empty,
                                         body: MessageEntity = HttpEntity.Empty,
                                         spNegoContext: Option[KrbCredentials] = None): FinalResult[Array[Byte]] = {

    requestWithRedirect(method, uri, headers, body, spNegoContext).flatMap(consumeStrict)
  }

  override def submitStreamRequest(method: HttpMethod,
                                   uri: Uri,
                                   headers: List[HttpHeader],
                                   body: MessageEntity,
                                   spNegoContext: Option[KrbCredentials]): FinalResult[Source[ByteString, _]] = {

    request(method, uri, headers, body, spNegoContext).map(consumeStream)
  }

  override def submitStreamRequestWithRedirect(method: HttpMethod,
                                               uri: Uri,
                                               headers: List[HttpHeader],
                                               body: MessageEntity,
                                               spNegoContext: Option[KrbCredentials]): FinalResult[Source[ByteString, _]] = {

    requestWithRedirect(method, uri, headers, body, spNegoContext).map(consumeStream)
  }


  private def request(method: HttpMethod, uri: Uri,
                      headers: List[HttpHeader] = List.empty,
                      body: RequestEntity = HttpEntity.Empty,
                      spNegoContext: Option[KrbCredentials] = None): RawResult = {

    val rqContext = RequestContext(idGenerator.nextRequestId(), System.currentTimeMillis())
    withSecurityContext(rqContext, uri, spNegoContext) { securityHeaders =>
      singleRequest(rqContext, method, uri, HttpEntity.Empty, securityHeaders ::: headers).map(finalizeResult)
    }
  }

  private def requestWithRedirect(method: HttpMethod, uri: Uri,
                                  headers: List[HttpHeader] = List.empty,
                                  body: RequestEntity = HttpEntity.Empty,
                                  spNegoContext: Option[KrbCredentials]): RawResult = {

    val rqContext = RequestContext(idGenerator.nextRequestId(), System.currentTimeMillis())
    withSecurityContext(rqContext, uri, spNegoContext) { securityHeaders =>
      singleRequest(rqContext, method, uri, HttpEntity.Empty, securityHeaders ::: headers).flatMap {
        case (tryResult@Success(response), context) =>
          response.status match {
            case StatusCodes.TemporaryRedirect =>
              response.header[Location] match {
                case Some(location) =>
                  logger.debug(s"Incoming HTTP redirect [${context.id}] ${response.status.intValue} [${rqTime(context)} ms]")

                  singleRequest(rqContext, method, location.uri, body, securityHeaders ::: headers)
                case _ => Future((tryResult, context))
              }

            case _ => Future((tryResult, context))
          }

        case tryResult => Future(tryResult)
      }.map(finalizeResult)
    }
  }

  private def withSecurityContext(rqContext: RequestContext, uri: Uri, KrbCredentials: Option[KrbCredentials])
                                                      (request: (List[HttpHeader]) => RawResult): RawResult = {

    KrbCredentials.map { creds =>
      logger.debug(s"Generate SpNego token for request [${rqContext.id}]")
      tokenGenerator.generate(creds.principal, creds.key.toString, uri.authority.host.address()).map { token =>
        val authorization = Authorization(GenericHttpCredentials("Negotiate", token))
        request(List(authorization))
      }.getOrElse(Future(Failure(AuthenticationException(s"Couldn't generate gss token for [${creds.principal}]")), rqContext))
    }.getOrElse(request(List.empty))
  }

  private def finalizeResult(result: (Try[HttpResponse], RequestContext)) = {
    ongoingRequests.remove(result._2.id)
    result._1 match {
      case Success(response) => logIncomingResponse(result._2, response)
      case Failure(e) =>
        logger.debug(s"Outgoing HTTP request [${result._2.id}] failed ${e.getMessage} [${rqTime(result._2)} ms]")
    }

    result
  }

  private def singleRequest(rqContext: RequestContext,
                            method: HttpMethod,
                            uri: Uri,
                            body: RequestEntity = HttpEntity.Empty,
                            headers: List[HttpHeader] = List.empty): RawResult = {

    val appHeaders = `X-Requested-By`("hw") :: headers
    val httpReq = HttpRequest.apply(method, uri, appHeaders, body)
    ongoingRequests.put(rqContext.id, (uri.toString(), System.currentTimeMillis()))
    logOutgoingRequest(rqContext, httpReq)
    Source.single(httpReq -> rqContext).via(poolClientFlow).runWith(Sink.head).recover(rqErrorHandler(rqContext))
  }

  private def rqErrorHandler[T](context: RequestContext): PartialFunction[Throwable, (Failure[T], RequestContext)] = {
    case _: TimeoutException =>
      (Failure(client.RequestTimeoutException(s"Outgoing http request [${context.id}] timeout [${rqTime(context)} ms]")), context)
    case EntityStreamSizeException(limit, actual) =>
      (Failure(EntitySizeLimitException(limit, actual, s"Incoming response entity exceeded content length limit $limit")), context)
    case _: StreamTcpException =>
      (Failure(ConnectionException(s"Outgoing http request [${context.id}] connection failed")), context)
    case e =>
      (Failure(client.RequestException(s"Outgoing http request [${context.id}] failed: ${e.getMessage}", e)), context)
  }

  private def logOutgoingRequest(context: RequestContext, rq: HttpRequest): Unit = {
    logger.debug(s"Outgoing HTTP request [${context.id}] ${rq.method} ${rq.uri}" +
      traceMsgOption(rq.headers).map("\n\n" + _).getOrElse("") + "\n")
  }

  private def logIncomingResponse(context: RequestContext, resp: HttpResponse): Unit = {
    logger.debug(s"Incoming HTTP response [${context.id}] ${resp.status} [${rqTime(context)} ms]" +
      traceMsgOption(resp.headers).map("\n\n" + _).getOrElse("") + "\n")
  }

  private def traceMsgOption(headers: Seq[HttpHeader]): Option[String] = {
    if (logger.underlying.isTraceEnabled) Some(headers.mkString("\n")) else None
  }

  private def logStrictResponse(context: RequestContext, data: Array[Byte]): Unit = {
    logger.debug(s"Incoming HTTP response [${context.id}] consumed in ${rqTime(context)} ms" +
    traceStrictResponse(data).map("\n\n" + _).getOrElse("") + "\n")
  }

  private def traceStrictResponse(data: Array[Byte]): Option[String] = {
    if (logger.underlying.isTraceEnabled) {
      val limit = Math.min(5 * 1024, data.length)
      val limited = new Array[Byte](limit)
      Array.copy(data, 0, limited, 0, limit)
      Some(new String(limited))
    } else {
      None
    }
  }

  private def rqTime(context: RequestContext): Long = {
    System.currentTimeMillis() - context.time
  }

  private def consumeStrict(result: (Try[HttpResponse], RequestContext)): FinalResult[Array[Byte]] = {
    result match {
      case (Success(response), context) =>
        response.entity
          .withSizeLimit(appConf.incomingHttpContentLimitKBytes * 1024)
          .toStrict(appConf.outgoingHttpRqTimeoutMs millis)
          .map { content =>
            logStrictResponse(context, content.data.toArray)
            Success(HttpClientResponse(response.status, content.data.toArray, response.headers))
          }.recover { case e: Throwable =>
            logger.debug(s"Incoming HTTP response [${result._2.id}] consume error after ${rqTime(result._2)} ms")
            rqErrorHandler(context).apply(e)._1
          }

      case (Failure(e), context) => Future(rqErrorHandler(context).apply(e)._1)
    }
  }

  private def consumeStream(result: (Try[HttpResponse], RequestContext)): Try[HttpClientResponse[Source[ByteString, _]]] = {
    result match {
      case (Success(response), _) =>
        Success(HttpClientResponse(response.status, response.entity.dataBytes, response.headers))
      case (Failure(e), context) =>
        rqErrorHandler(context).apply(e)._1
    }
  }
}