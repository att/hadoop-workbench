package com.directv.hw.hadoop.oozie.config

import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.access.AccessManagerService
import com.directv.hw.hadoop.config.{DescriptorConverter, MustacheClusterDictionary}
import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.files.exception.NotFoundException
import com.directv.hw.hadoop.oozie.service.OozieFilesConverter
import com.directv.hw.hadoop.platform.service.PlatformManager
import com.directv.hw.persistence.dao.{ClusterDao, CustomClusterDataDao, OozieWorkflowDao}
import org.scalamock.scalatest.MockFactory
import org.scalatest.{FlatSpec, Matchers}
import scaldi.Module

import scala.concurrent.ExecutionContext
import scala.language.reflectiveCalls

class OozieComponentInfoProcessorSpec extends FlatSpec with Matchers with MockFactory {

  private val platformManager = mock[PlatformManager]
  private val dictionary = mock[MustacheClusterDictionary]
  private val converter = mock[OozieFilesConverter]
  private val descriptorConverter = mock[DescriptorConverter]
  private val fs  = mock[ComponentFS]
  private val appConf = mock[AppConf]
  private val customPropertiesDao = mock[CustomClusterDataDao]
  private val deploymentDao = mock[OozieWorkflowDao]
  private val dispatcherFactory = mock[DispatcherFactory]
  private val accessManagerMock = mock[AccessManagerService]
  private val clusterDaoMock = mock[ClusterDao]

  implicit object TestModule extends Module {
    bind[PlatformManager] to platformManager
    bind[MustacheClusterDictionary] to dictionary
    bind[OozieFilesConverter] to converter
    bind[DescriptorConverter] to descriptorConverter
    bind[AppConf] to appConf
    bind[CustomClusterDataDao] to customPropertiesDao
    bind[OozieWorkflowDao] to deploymentDao
    bind[DispatcherFactory] to dispatcherFactory
    bind[AccessManagerService] to accessManagerMock
    bind[ClusterDao] to clusterDaoMock
  }

  (dispatcherFactory.auxiliaryDispatcher _).expects().returns(ExecutionContext.Implicits.global)

  val processor = new OozieTemplateProcessor {


    def testXmlRendering(xml: String, fs: ComponentFS, attributes: Map[String, () => Option[String]]): List[String] = {
       renderWfRecursively(xml, fs, attributes)
    }
  }

  "processor" should "render all sub-wf" in {
    (fs.getFileContent _).expects("workflow.xml").returns(OozieComponentInfoProcessorSpec.xml)
    (fs.getFileContent _).expects("subworkflow/workflow1.xml").returns(OozieComponentInfoProcessorSpec.subXml)
    (fs.getFileContent _).expects("subworkflow/workflow2.xml").returns(OozieComponentInfoProcessorSpec.subXml)
    (fs.getFileContent _).expects("subworkflow/workflow3.xml").throws(new NotFoundException)

    (fs.saveFileContent _).expects("workflow.xml", *, *)
    (fs.saveFileContent _).expects("subworkflow/workflow1.xml", *, *)
    (fs.saveFileContent _).expects("subworkflow/workflow2.xml", *, *)

    val attributes = Map("jobTracker" -> (() => Some("testJobTracker")))
    val missing = processor.testXmlRendering("workflow.xml", fs, attributes)

    // missing 1 nameNode from parent 2 nameNode properties from sub-wf
    missing should have size 3
  }
}

object OozieComponentInfoProcessorSpec {
  val xml = """<workflow-app name="recommendation-on-collaborative-filtration" xmlns="uri:oozie:workflow:0.1">
      <start to="collaborative-filtration"/>
      <action name="collaborative-filtration">
        <jobTracker>{{jobTracker}}</jobTracker>
        <nameNode>{{nameNode}}</nameNode>
        <ok to="end"/>
        <error to="fail"/>
      </action>
      <action name="sub-workflow_1">
        <sub-workflow>
            <app-path>${wf:conf('oozie.wf.application.path')}/subworkflow/workflow1.xml</app-path>
        </sub-workflow>
      </action>
      <action name="sub-workflow_1">
        <sub-workflow>
            <app-path>subworkflow/workflow2.xml</app-path>
        </sub-workflow>
      </action>
      <end name="end"/>
    </workflow-app>"""

  val subXml = """<workflow-app name="recommendation-on-collaborative-filtration" xmlns="uri:oozie:workflow:0.1">
      <start to="collaborative-filtration"/>
      <kill name="fail">
        <message>Fail mllib collaborative-filtration</message>
      </kill>
      <jobTracker>{{jobTracker}}</jobTracker>
      <nameNode>{{nameNode}}</nameNode>
      <action name="sub-workflow_1">
        <sub-workflow>
          <app-path>subworkflow/workflow3.xml</app-path>
        </sub-workflow>
      </action>
      <end name="end"/>
    </workflow-app>"""
}
