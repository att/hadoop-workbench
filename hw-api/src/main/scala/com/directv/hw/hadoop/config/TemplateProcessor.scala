package com.directv.hw.hadoop.config

import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.model.{ClusterPath, ModulePath}

import scala.concurrent.Future

trait TemplateProcessor {
  def renderFiles(fileSystem: ComponentFS, modulePath: ModulePath): RenderingErrors
  def updateConfiguration(clusterPath: ClusterPath, user: String): Future[Unit]
}
