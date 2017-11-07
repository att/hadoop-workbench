package com.directv.hw.hadoop.config

import com.directv.hw.core.service.HadoopConfigNames.HadoopConfigName
import com.directv.hw.hadoop.model.ClusterPath

trait ClusterConfigService {
  def pullConfigFiles(clusterPath: ClusterPath): Unit
  def pullConfigsQuietly(): Unit
  def pullConfigsQuietly(platformId: Int): Unit
  def getConfig(clusterPath: ClusterPath, configName: HadoopConfigName): Option[String]
  def deleteConfigs(platformId: Int): Unit
}
