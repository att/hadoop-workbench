package com.directv.hw.common.web

import java.io.InputStream
import spray.http.{HttpMethods, HttpRequest, HttpHeader, Uri}

class HttpStreamRequest(val streams: List[InputStream],
                        uri: Uri = Uri./,
                        headers: List[HttpHeader] = Nil) extends HttpRequest(HttpMethods.POST, uri, headers)
