package com.directv.hw.core.exception

case class AuthenticationException(message: String = "", cause: Throwable = null) extends Exception(message, cause)
