package com.directv.hw.hadoop.http.client

import akka.http.scaladsl.model._

case class HttpClientRequest(method: HttpMethod,
                             uri: Uri,
                             headers: List[HttpHeader] = List.empty,
                             body: RequestEntity = HttpEntity.Empty)

case class HttpClientResponse[T](status: StatusCode, body: T, headers: Seq[HttpHeader] = Seq.empty)

