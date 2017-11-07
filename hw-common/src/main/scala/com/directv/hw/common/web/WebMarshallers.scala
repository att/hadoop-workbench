package com.directv.hw.common.web

import com.directv.hw.core.log.{DebugLevel, InfoLevel, LogLevel}
import com.directv.hw.logging.AuditLogging
import spray.http._
import spray.httpx.marshalling.{Marshaller, ToResponseMarshallable, ToResponseMarshaller}
import spray.httpx.unmarshalling.{Deserialized, FromRequestUnmarshaller, Unmarshaller, UnsupportedContentType}
import spray.json.{DefaultJsonProtocol, JsonFormat, JsonParser, JsonPrinter, PrettyPrinter, RootJsonReader, RootJsonWriter, jsonReader}

import scala.util.{Failure, Success, Try}

trait WebMarshallers extends DefaultJsonProtocol {

  implicit val stremReqUnmarshaller = new FromRequestUnmarshaller[StreamEntity] {
    override def apply(request: HttpRequest): Deserialized[StreamEntity] = {
      request match {
        case req: HttpStreamRequest => Right(StreamEntity(req.streams))
        case unknown => Left(UnsupportedContentType("expected StreamRequest but was " + unknown.getClass.getName))
      }
    }
  }

  implicit def responseFormat[T: JsonFormat] = jsonFormat1(SuccessResponse[T])

  implicit val errorResponseFormat = jsonFormat2(ErrorResponse)

  implicit def sprayJsonUnmarshaller[T: RootJsonReader] =
    Unmarshaller[T](MediaTypes.`application/json`) {
      case x: HttpEntity.NonEmpty ⇒
        val json = JsonParser(x.asString(defaultCharset = HttpCharsets.`UTF-8`))
        jsonReader[T].read(json)
    }

  implicit def errorResponseMarshaller(implicit writer: RootJsonWriter[ErrorResponse], printer: JsonPrinter = PrettyPrinter) =
    Marshaller.delegate[ErrorResponse, String](ContentTypes.`application/json`) { value ⇒
      val json = writer.write(value)
      printer(json)
    }

  implicit def sprayJsonMarshaller[T](implicit writer: RootJsonWriter[SuccessResponse[T]], printer: JsonPrinter = PrettyPrinter) =
    Marshaller.delegate[T, String](ContentTypes.`application/json`) { value ⇒
      val json = writer.write(SuccessResponse(value))
      printer(json)
    }

  implicit def infoAuditMarshaller[T: ToResponseMarshaller] = new AuditMarshaller[T, InfoLevel] {
    override def apply(user: String, op: String, details: String, response: => T) = {
      auditableResult(user, op, details) {
        val result = response
        AuditLogging.logger.info(user, op, details)
        result
      }
    }
  }

  implicit def debugAuditMarshaller[T: ToResponseMarshaller] = new AuditMarshaller[T, DebugLevel ] {
    override def apply(user: String, op: String, details: String, response: => T) = {
      auditableResult(user, op, details) {
        val result = response
        AuditLogging.logger.debug(user, op, details)
        result
      }
    }
  }

  private def auditableResult[T: ToResponseMarshaller](user: String, op: String, details: String)
                                                      (response: => T): ToResponseMarshallable = {
    Try(response) match {
      case Success(result) =>
        ToResponseMarshallable.isMarshallable(result)
      case failure@Failure(e) =>
        AuditLogging.logger.error(user, op, details, e.getMessage)
        failure
    }
  }
}

trait AuditMarshaller[T, L <: LogLevel] {
  def apply(user: String, operation: String, details: String, result: => T): ToResponseMarshallable
}

