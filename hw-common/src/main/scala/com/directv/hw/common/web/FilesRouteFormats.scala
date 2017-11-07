package com.directv.hw.common.web

import com.directv.hw.core.exception.NotSupportedException
import com.directv.hw.hadoop.model.{FileContent, ParsedContent}
import spray.json.{DefaultJsonProtocol, JsValue, RootJsonFormat}

import scala.annotation.tailrec
import scala.util.{Failure, Success, Try}

trait FilesRouteFormats extends DefaultJsonProtocol {

  implicit object ParsedFileFormat extends RootJsonFormat[ParsedContent] {
    def write(x: ParsedContent) = marshalFileContent(x)
    def read(value: JsValue) = parseContent(value)
  }

  implicit val fileContentFormat = jsonFormat2(FileContent)
  implicit val copyToPlatformFormat = jsonFormat5(CopyFilesToPlatform)
  implicit val copyToTenantFormat = jsonFormat2(CopyFilesToTenant)

  def marshalFileContent: PartialFunction[ParsedContent, JsValue] = {
    case o => throw new NotSupportedException("no marshaller for type - " + o.getClass.getName)
  }

  private def parseContent(value: JsValue): ParsedContent = {
    findAndParse(fileContentParsers, value)
  }

  @tailrec
  private def findAndParse(parsers: List[JsValue => ParsedContent], value: JsValue): ParsedContent = {
    parsers match {
      case parser :: remaining =>
        Try {
          parser(value)
        } match {
          case Success(result) => result
          case Failure(e) => findAndParse(remaining, value)
        }
      case Nil =>
        throw new NotSupportedException("no parser for json - " + value.toString)
    }
  }

  def fileContentParsers: List[JsValue => ParsedContent] = List.empty
}
