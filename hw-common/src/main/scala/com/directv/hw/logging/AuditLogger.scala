package com.directv.hw.logging

import com.typesafe.scalalogging.LazyLogging

object AuditLogging {
  val logger = new AuditLogger
}

trait AuditLogging {
  lazy val auditLogger: AuditLogger = AuditLogging.logger
}

class AuditLogger private[logging] () extends LazyLogging {

  def trace(user: String, operation: String, details: String = ""): Unit = {
    logger.trace(composeMsg(user, operation, details))
  }

  def debug(user: String, operation: String, details: String = ""): Unit = {
    logger.debug(composeMsg(user, operation, details))
  }

  def info(user: String, operation: String, details: String = ""): Unit = {
    logger.info(composeMsg(user, operation, details))
  }

  def error(user: String, operation: String, details: String = "", error: String = ""): Unit = {
    val errorMsg = s"error=$error"
    val detailsMsg = if (details.isEmpty) errorMsg else details + ", " + errorMsg
    logger.info(composeMsg(user, operation, detailsMsg))
  }

  private def composeMsg(user: String, operation: String, details: String = ""): String = {
    val detailsMsg = if (details.isEmpty) "" else s"[$details]"
    s"user=$user, operation=$operation $detailsMsg"
  }
}
