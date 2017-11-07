package com.directv.hw.hadoop.oozie.converter

import com.directv.hw.hadoop.config.ConfigConverter
import com.directv.hw.hadoop.oozie.service.WorkflowParser
import com.typesafe.scalalogging.LazyLogging
import org.scalamock.scalatest.MockFactory
import org.scalatest.{FlatSpec, Matchers}
import scaldi.Module

class OozieFilesConvertersSpec extends FlatSpec with Matchers with MockFactory with LazyLogging {

  private val configConverter = mock[ConfigConverter]
  private val workflowParser = mock[WorkflowParser]

  implicit object TestModule extends Module {
    bind[ConfigConverter] to configConverter
    bind[WorkflowParser] to workflowParser
  }

  val converter = new OozieFilesConverterImpl(List.empty, List.empty)

  "converter" should "parse backslash" in {
    val propsText = "backslash=\\|"
    val config = converter.toProperties(propsText)
    config.head.value shouldBe "\\|"
  }

  "converter" should "preserve order" in {
    val propsText = """spark.panthers.datapipeline.guidedata.contentdetails.path=12
                      |spark.panthers.datapipeline.guidedata.schedule.path=12
                      |spark.panthers.datapipeline.guidedata.contentcredits.path=12
                      |spark.panthers.datapipeline.guidedata.channel.path=12
                      |spark.panthers.datapipeline.udm.viewinghistory.landingzone.path=12
                      |spark.panthers.datapipeline.udm.viewinghistory.output.path=12""".stripMargin

    val config = converter.toProperties(propsText)
    config.head.key shouldBe "spark.panthers.datapipeline.guidedata.contentdetails.path"
    config.last.key shouldBe "spark.panthers.datapipeline.udm.viewinghistory.output.path"
  }
}
