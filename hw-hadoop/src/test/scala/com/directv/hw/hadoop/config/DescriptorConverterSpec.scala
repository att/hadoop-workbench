package com.directv.hw.hadoop.config

import org.scalamock.scalatest.MockFactory
import org.scalatest.{FlatSpec, Matchers}

class DescriptorConverterSpec extends FlatSpec with Matchers with MockFactory {

  val converter = new DescriptorConverterImpl

  "processor" should "render XML file" in {
    val text = """{
                 |  "type": "oozie",
                 |  "artifactId": "Omniture pipeline example",
                 |  "version": "1.0",
                 |  "linkedProperties": [{
                 |    "title": "Ingestion",
                 |    "filePath": "conf/ingesting.properties"
                 |  }, {
                 |    "title": "Enrichment",
                 |    "filePath": "conf/enrichment.properties"
                 |  }]
                 |}""".stripMargin

    val descriptor = converter.parse(text)
    descriptor.`type` shouldBe "oozie"
  }
}
