package com.directv.hw.hadoop.flume.model

import com.directv.hw.hadoop.host.model.PlatformHost


sealed abstract class SyncResult
case object SyncOk extends SyncResult
case object SyncRequired extends SyncResult
case class SyncError(error: String) extends SyncResult

case class SyncTarget(id: String, host: PlatformHost, dir: String, subDir: String)

case class SyncInstance(target: SyncTarget, result: SyncResult)


// persisted synchronization state

case class PersistedSyncInstance(id: String, result: SyncResult)

case class SyncState(instances: List[PersistedSyncInstance])