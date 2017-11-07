package com.directv.hw.hadoop.flume.service

import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.flume.model._
import com.directv.hw.hadoop.model.ModulePath

trait FlumeLocalRepo {
  def getFileService(modulePath: ModulePath): ComponentFS
  def deleteAgentFiles(agentPath: ModulePath)
  def getSyncStatus(agentPath: ModulePath, targets: List[SyncTarget]): SyncState
  def addSyncTarget(agentPath: ModulePath, target: SyncTarget): PersistedSyncInstance
  def deleteSyncTarget(agentPath: ModulePath, target: SyncTarget)
  def forgetSyncTarget(agentPath: ModulePath, target: SyncTarget)
  def refreshSync(agentPath: ModulePath, targets: List[SyncTarget]): SyncState
  def pullPlugins(agentPath: ModulePath, targets: List[SyncTarget]): SyncState
  def pushPlugins(agentPath: ModulePath, targets: List[SyncTarget]): SyncState
  def deletePlugins(agentPath: ModulePath, targets: List[SyncTarget]): SyncState
  def onUpdate(agentPath: ModulePath)
  def onInstanceUpdate(agentPath: ModulePath, instanceId: String)
  def saveComponent(comp: FlumeComponent)
  def deleteComponent(modulePath: ModulePath)
  def getAllComponents: List[FlumeComponent]
}
