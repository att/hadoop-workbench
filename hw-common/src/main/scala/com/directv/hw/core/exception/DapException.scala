package com.directv.hw.core.exception

sealed abstract class ErrorType(val code: String)
case object ErrorTypeNonEmpty extends ErrorType("NON_EMPTY")
case object ErrorTypeAlreadyExists extends ErrorType("ALREADY_EXISTS")

class DapException(message: String, cause: Throwable = null, val errorType: Option[ErrorType] = None) extends Exception(message, cause)

class ServerError(message: String, cause: Throwable = null, errorType: Option[ErrorType] = None) extends DapException(message, cause, errorType)

class CalleeException(message: String, cause: Throwable = null, errorType: Option[ErrorType] = None) extends DapException(message, cause, errorType)

