package com.directv.hw.hadoop.platform.model.status

sealed abstract class PlatformStatus
case class ProvisionInProgress(progress: Int) extends PlatformStatus
case class ProvisionError(message: String) extends PlatformStatus
case object ProvisionUnknown extends PlatformStatus
case object DestroySuccess extends PlatformStatus
case class DestroyInProgress(progress: Int) extends PlatformStatus
case class DestroyError(message: String) extends PlatformStatus
case class Online(host: Option[String]) extends PlatformStatus
case class Offline(host: Option[String]) extends PlatformStatus
case class ErrorStatus(message: String) extends PlatformStatus
case class UnknownStatus(message: String) extends PlatformStatus

