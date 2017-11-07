package com.directv.hw.core.exception

case class ServiceNotFoundException(message: String = "", cause: Throwable = null) extends Exception(message, cause)