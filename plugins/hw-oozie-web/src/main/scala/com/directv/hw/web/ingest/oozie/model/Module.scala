package com.directv.hw.web.ingest.oozie.model

import com.directv.hw.hadoop.model.ParsedContent

case class DeployByPathRequest(platformId: Int, clusterId: String, path: String, templateId: Int)
case class DeployByEnvRequest(platformId: Int, clusterId: String, env: String, templateId: Int)

case class NodeTemplateContent(properties: String) extends ParsedContent


