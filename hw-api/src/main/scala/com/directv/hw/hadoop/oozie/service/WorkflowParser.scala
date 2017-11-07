package com.directv.hw.hadoop.oozie.service

import java.io.InputStream

import com.directv.hw.hadoop.oozie.model.WorkflowInfo

import scala.io.Source

trait WorkflowParser {
  def getWorkflowInfoFromFile(path: String): Option[WorkflowInfo]
  def getWorkflowInfoFromStream(stream: InputStream): Option[WorkflowInfo]
  def getWorkflowInfoFromString(string: String): Option[WorkflowInfo]
  def getWorkflowInfoFromSource(source: Source): Option[WorkflowInfo]
}
