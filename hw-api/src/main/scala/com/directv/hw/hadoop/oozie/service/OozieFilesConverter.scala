package com.directv.hw.hadoop.oozie.service

import com.directv.hw.hadoop.config.ConfigEntry
import com.directv.hw.hadoop.oozie.model.WorkflowGraph


trait OozieFilesConverter {
  def getSubtypeMetadata(version: String): String
  def getSupportedWorkflowVersions: List[String]
  
  def parseWorkflowXml(xml: String): WorkflowGraph
  def marshalWorkflowGraph(graph: WorkflowGraph, options: ConversionOptions): String

  def parseConfig(configXml: String): List[ConfigEntry]
  def marshalConfig(entries: Iterable[ConfigEntry]): String

  def toProperties(text: String): List[ConfigEntry]
  def toPropertiesText(entries: List[ConfigEntry]): String

  def convertNodeTemplate(nodeXml: String, version: String): String
}
