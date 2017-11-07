package com.directv.hw.hadoop.oozie.parser

import com.directv.hw.hadoop.oozie.model.WorkflowInfo
import org.scalatest.{FlatSpec, Matchers}

import scala.io.Source

class WorkflowParserSpec extends FlatSpec with Matchers {

  def retrieveWorkflowInfo(path: String): Option[WorkflowInfo] = {
    val source = Source.fromURL(getClass.getResource(path))
    new WorkflowParserImpl().getWorkflowInfoFromSource(source)
  }

  "parser" should "retrieve the correct name and version" in {
    val workFlowInfo = retrieveWorkflowInfo("/workflow/workflow-good.xml")
    workFlowInfo should be ('defined)
    workFlowInfo.get.name should be ("test-workflow")
    workFlowInfo.get.version should be ("0.4")
  }

  it should "return None if empty name or version (missing attributes)" in {
    retrieveWorkflowInfo("/workflow/workflow-missing-attrs.xml") should be (None)
  }

  it should "return None if file not found" in {
    new WorkflowParserImpl().getWorkflowInfoFromFile("/&*()&(&((") should be (None)
  }

  it should "return None (invalid tag)" in {
    val workFlowInfo = retrieveWorkflowInfo("/workflow/workflow-invalid-tag.xml")
    workFlowInfo should be (None)
  }

  it should "return None (invalid workflow xml schema)" in {
    retrieveWorkflowInfo("/workflow/workflow-invalid-schema.xml") should be (None)
  }

  "parser" should "retrieve the correct name and version for custom namespaces" in {
    val workFlowInfo = retrieveWorkflowInfo("/workflow/workflow-custom-namespaces.xml")
    workFlowInfo should be ('defined)
    workFlowInfo.get.name should be ("test")
    workFlowInfo.get.version should be ("0.5")
  }
}
