package com.directv.hw.hadoop.http.client.header

import akka.http.scaladsl.model.headers.{ModeledCustomHeader, ModeledCustomHeaderCompanion}

import scala.util.{Success, Try}

object `X-Requested-By` extends ModeledCustomHeaderCompanion[`X-Requested-By`] {
  def name = "X-Requested-By"
  override def parse(value: String): Try[`X-Requested-By`] = Success(`X-Requested-By`(value))
}

case class `X-Requested-By`(headerValue: String) extends ModeledCustomHeader[`X-Requested-By`] {
  override def companion: ModeledCustomHeaderCompanion[`X-Requested-By`] = `X-Requested-By`
  override def value(): String = headerValue
  override def renderInResponses() = true
  override def renderInRequests() = true
}