package com.directv.hw.web.ingest.flume.model

case class DeploymentInfo(platform: Int, cluster: String, service: String, name: String, templateId: Int, pluginDir: Option[String])
