package com.directv.hw.common.web

import com.directv.hw.hadoop.model.{FileContent, ParsedContent}
import org.scalatest.{FlatSpec, Matchers}
import spray.json.{JsValue, DefaultJsonProtocol}
import spray.json._

class FilesRouteFormatsSpec extends FlatSpec with Matchers with FilesRouteFormats with DefaultJsonProtocol {

  override def fileContentParsers: List[(JsValue) => ParsedContent] = {
    List (
      _.convertTo[TestParsedContent2],
      _.convertTo[TestParsedContent]
    )
  }

  private case class TestParsedContent(x: String, y: Int) extends ParsedContent
  private case class TestParsedContent2(x: String, y: Int, z: String) extends ParsedContent

  private implicit val testParsedContentFormat = jsonFormat2(TestParsedContent)
  private implicit val testParsedContentFormat2 = jsonFormat3(TestParsedContent2)


  val content1 =
    """
      |{
      | "x": "test",
      | "y": 1
      |}
    """.stripMargin.parseJson

  val content2 =
    """
      |{
      | "x": "test",
      | "y": 1,
      | "z": "test"
      |}
    """.stripMargin.parseJson

  "content" should "be parsed" in {
    ParsedFileFormat.read(content2) should be (TestParsedContent2("test", 1, "test"))
    ParsedFileFormat.read(content1) should be (TestParsedContent("test", 1))
  }


  val complexContent =
    """
      |{
      | "text": "test",
      | "content": {
      |   "x": "test",
      |   "y": 1,
      |   "z": "test"
      | }
      |}
    """.stripMargin.parseJson

  "complex content" should "be parsed" in {
    val parsed = complexContent.asJsObject.convertTo[FileContent]
    parsed should be (FileContent(Some("test"), Some(TestParsedContent2("test", 1, "test"))))
  }
}
