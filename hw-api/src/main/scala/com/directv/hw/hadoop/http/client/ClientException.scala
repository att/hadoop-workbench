package com.directv.hw.hadoop.http.client

sealed abstract class HttpClientException(message: String = "", e: Throwable = null) extends Exception(message, e)
case class BadResponseException(code: Int, reason: String = "") extends HttpClientException(message = reason)
case class EntitySizeLimitException(limit: Long, actual: Option[Long], message: String = "") extends HttpClientException(message = message)
case class RequestException(message: String = "", cause: Throwable = null) extends HttpClientException(message, cause)
case class AuthenticationException(message: String = "", cause: Throwable = null) extends HttpClientException(message, cause)
case class RequestTimeoutException(message: String = "", cause: Throwable = null) extends HttpClientException(message, cause)
case class UnknownResponseException(message: String = "", cause: Throwable = null) extends HttpClientException(message, cause)
case class UnknownHostException(message: String = null, cause: Throwable = null) extends HttpClientException(message, cause)
case class ConnectionException(message: String = null, cause: Throwable = null) extends HttpClientException(message, cause)
