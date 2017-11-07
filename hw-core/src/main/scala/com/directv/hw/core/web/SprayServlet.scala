package com.directv.hw.core.web

import javax.servlet.http.{HttpServletRequest, HttpServletResponse}
import akka.http.scaladsl.model.StatusCodes
import com.directv.hw.common.web.HttpStreamRequest
import com.directv.hw.core.service.AppConf
import org.apache.commons.fileupload.disk.DiskFileItemFactory
import org.apache.commons.fileupload.servlet.ServletFileUpload
import scaldi.{Injectable, Injector}
import spray.http.parser.HttpParser
import spray.http.MediaTypes
import spray.servlet.{ModelConverter, Servlet30ConnectorServlet}
import spray.routing._
import scala.collection.JavaConversions._

class SprayServlet extends Servlet30ConnectorServlet with Injectable {
  private var appConf: AppConf = _
  private var sprayRoute: Route = _

  override def init() = {
    super.init()
    implicit val injector = getServletContext.getAttribute(classOf[Injector].getName).asInstanceOf[Injector]
    appConf = inject[AppConf]
    sprayRoute = inject[RestRouter].route
  }

  override def service(req: HttpServletRequest, resp: HttpServletResponse) = {

    if (ServletFileUpload.isMultipartContent(req)) {
      val maxContentLengthMBytes = appConf.uploadHttpContentLimitMBytes
      val overLimit = Option(req.getHeader("Content-Length")).exists(_.toLong > maxContentLengthMBytes * 1024 * 1024)
      if (overLimit) {
        resp.setContentType(MediaTypes.`application/json`.value)
        resp.setStatus(StatusCodes.BadRequest.intValue)
        val message = s"""{"message":"Request payload exceeds $maxContentLengthMBytes mbytes"} """
        val os = resp.getOutputStream
        os.write(message.getBytes)
        os.flush()
      } else {
        val upload = new ServletFileUpload(new DiskFileItemFactory)
        val streams = upload.parseRequest(req).toList.map(_.getInputStream)


        val (errors, parsedHeaders) = HttpParser.parseHeaders(ModelConverter.rawHeaders(req))
        if (errors.nonEmpty && settings.illegalHeaderWarnings) errors.foreach(e ⇒ log.warning(e.formatPretty))

        val streamReq = new HttpStreamRequest (
          streams,
          uri = ModelConverter.rebuildUri(req),
          headers = ModelConverter.addOptionalHeaders(req, parsedHeaders)
        )

        val responder = new Responder(req, resp, streamReq)
        serviceActor.tell(streamReq, responder)
      }

    } else {
      super.service(req, resp)
    }
  }
}
