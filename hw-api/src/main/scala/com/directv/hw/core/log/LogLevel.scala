package com.directv.hw.core.log

sealed trait LogLevel
trait TraceLevel extends LogLevel
trait DebugLevel extends LogLevel
trait InfoLevel extends LogLevel
trait ErrorLevel extends LogLevel
