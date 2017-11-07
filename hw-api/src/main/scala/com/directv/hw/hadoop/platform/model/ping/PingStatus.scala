package com.directv.hw.hadoop.platform.model.ping

sealed abstract class PingStatus

case object PingSuccess extends PingStatus
case object NoResponse extends PingStatus
case class PingError(message: String) extends PingStatus
case class PingUnknown(message: String) extends PingStatus
