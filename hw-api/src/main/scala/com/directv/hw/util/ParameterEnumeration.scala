package com.directv.hw.util

import com.directv.hw.core.exception.NotSupportedException

import scala.language.implicitConversions

abstract class ParameterEnumeration extends Enumeration {

  implicit def fromString(value: String): Value = {
    try {
      this.withName(value)
    } catch {
      case e: java.util.NoSuchElementException => throw new NotSupportedException(s"parameter [$value] is not supported")
    }
  }
}
