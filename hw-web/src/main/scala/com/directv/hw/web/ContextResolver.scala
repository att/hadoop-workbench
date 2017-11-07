package com.directv.hw.web

import javax.servlet.http.{HttpServlet, HttpServletResponse, HttpServletRequest}

import com.directv.hw.core.exception.NotFoundException
import com.typesafe.scalalogging.LazyLogging

class ContextResolver extends HttpServlet with LazyLogging {
  override def service(rq: HttpServletRequest, rp: HttpServletResponse): Unit = {
    val uri = rq.getRequestURI
    val segments = uri.split("/").toList.filterNot(_.isEmpty)

    // redirect only context root
    if (segments.size == 1) {
      rp.sendRedirect("/" + segments.head + "/dashboard/index.html")
    } else {
      throw new NotFoundException(s"unhandled uri - $uri")
    }
  }
}
