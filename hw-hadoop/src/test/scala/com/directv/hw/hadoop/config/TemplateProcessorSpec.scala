package com.directv.hw.hadoop.config

import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.hadoop.platform.service.PlatformManager
import org.scalamock.scalatest.MockFactory
import org.scalatest.{FlatSpec, Matchers}
import scaldi.Module

import scala.concurrent.Future
import scala.xml.XML
import scala.language.reflectiveCalls


class TemplateProcessorSpec extends FlatSpec with Matchers with MockFactory {

  private val platformManager = mock[PlatformManager]
  private val dictionary = mock[MustacheClusterDictionary]

  implicit object TestModule extends Module {
    bind[PlatformManager] to platformManager
    bind[MustacheClusterDictionary] to dictionary
  }

  val processor = new AbstractTemplateProcessor {
    def testXmlRendering(xml: String, attributes: Map[String, () => Option[String]]): RenderingResult[String] = {
      renderXmlFile(xml, attributes)
    }

    override def updateConfiguration(clusterPath: ClusterPath, user: String): Future[Unit] = ???
  }

  "processor" should "render XML file" in {

    val attributes = Map("jobTracker" -> (() => Some("testJobTracker")))

    val testXml = """<workflow-app name="recommendation-on-collaborative-filtration" xmlns="uri:oozie:workflow:0.1">
      <start to="collaborative-filtration"/>
      <action name="collaborative-filtration">
        <spark xmlns="uri:oozie:spark-action:0.1">
          <job-tracker>{{jobTracker}}</job-tracker>
          <name-node>{{nameNode}}</name-node>
          <master>yarn-cluster</master>
          <mode>cluster</mode>
          <name>collaborative-filtration-spark</name>
          <class>com.mllib.CollaborativeFiltration</class>
          <jar>/lib/collaborative-filtration-spark.jar</jar>
          <arg>collaborativeFiltrationInput</arg>
          <arg>collaborativeFiltrationOutput</arg>
          <arg>yarn-cluster</arg>
        </spark>
        <ok to="end"/>
        <error to="fail"/>
      </action>
      <kill name="fail">
        <message>Fail mllib collaborative-filtration</message>
      </kill>
      <end name="end"/>
    </workflow-app>"""


    val result = processor.testXmlRendering(testXml, attributes)
    result.errors should have length 1
    result.errors.head should include ("nameNode")

    val jobTrackerNode = XML.loadString(result.rendered) \ "action" \ "spark" \"job-tracker"
    jobTrackerNode.text shouldBe "testJobTracker"
  }
}
