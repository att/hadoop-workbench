package com.directv.hw.hadoop.flume.service

import com.directv.hw.hadoop.flume.model._
import com.directv.hw.hadoop.model.{RelativeModulePath, RelativeServicePath}

trait FlumeService {
  def listComponents(servicePath: RelativeServicePath): List[FlumeComponentInfo]
  def createEmptyComponent(servicePath: RelativeServicePath, name: String): String
  def getComponentConfig(modulePath: RelativeModulePath): FlumeComponentConfig
  def updateComponentConfig(modulePath: RelativeModulePath, config: FlumeComponentUpdate)
  def getPipelineConfig(modulePath: RelativeModulePath): String
  def updatePiplelineConfig(modulePath: RelativeModulePath, textConfig: String)
  def deleteComponent(modulePath: RelativeModulePath)

  def getInstances(modulePath: RelativeModulePath): AgentInstancesData
  def getInstance(modulePath: RelativeModulePath, instanceId: String): AgentInstance
  def createInstance(modulePath: RelativeModulePath, hostId: String): AgentInstance

  def getInstancePipelineConfig(modulePath: RelativeModulePath, instanceId: String): String
  def updateInstanceComponentConfig(modulePath: RelativeModulePath, instanceId: String, config: FlumeComponentUpdate)
  def updateInstancePipelineConfig(modulePath: RelativeModulePath, instanceId: String, pipeline: String)
  def deleteInstance(modulePath: RelativeModulePath, hostId: String)
  def startAgentInstance(modulePath: RelativeModulePath, instanceId: String): AgentInstance
  def stopAgentInstance(modulePath: RelativeModulePath, instanceId: String): AgentInstance
}
