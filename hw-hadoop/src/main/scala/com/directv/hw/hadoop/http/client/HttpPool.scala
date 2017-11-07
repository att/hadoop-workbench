package com.directv.hw.hadoop.http.client

import akka.NotUsed
import akka.http.scaladsl.model.{HttpRequest, HttpResponse}
import akka.stream.scaladsl.Flow

import scala.util.Try

case class HttpPool(flow: Flow[(HttpRequest, RequestContext), (Try[HttpResponse], RequestContext), NotUsed])
