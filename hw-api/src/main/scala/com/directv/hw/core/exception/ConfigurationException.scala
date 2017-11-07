package com.directv.hw.core.exception

case class ConfigurationException(message: String = "", error: Throwable = null) extends RuntimeException(message, error)
