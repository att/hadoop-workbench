package com.directv.hw.hadoop.http.client

import akka.http.scaladsl.model._
import akka.stream.scaladsl.Source
import akka.util.ByteString

import scala.concurrent.Future
import scala.util.Try

trait HttpDispatcher {

  def submitRequest(method: HttpMethod,
                    uri: Uri,
                    headers: List[HttpHeader] = List.empty,
                    body: RequestEntity = HttpEntity.Empty,
                    credentials: Option[KrbCredentials] = None): Future[Try[HttpClientResponse[Array[Byte]]]]


  def submitStreamRequest(method: HttpMethod,
                          uri: Uri,
                          headers: List[HttpHeader] = List.empty,
                          body: RequestEntity = HttpEntity.Empty,
                          credentials: Option[KrbCredentials] = None): Future[Try[HttpClientResponse[Source[ByteString, _]]]]

  def submitRequestWithRedirect(method: HttpMethod,
                                uri: Uri,
                                headers: List[HttpHeader] = List.empty,
                                body: RequestEntity = HttpEntity.Empty,
                                credentials: Option[KrbCredentials] = None): Future[Try[HttpClientResponse[Array[Byte]]]]

  def submitStreamRequestWithRedirect(method: HttpMethod,
                                      uri: Uri,
                                      headers: List[HttpHeader] = List.empty,
                                      body: RequestEntity = HttpEntity.Empty,
                                      credentials: Option[KrbCredentials] = None): Future[Try[HttpClientResponse[Source[ByteString, _]]]]


  def getOngoingRequests: List[(String, Long)]
}
