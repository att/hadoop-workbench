package com.directv.hw.util

import scala.collection.mutable.ArrayBuffer

trait EnumObject[T] {

  private val _values = ArrayBuffer.empty[T]

  protected def register(obj: T): T = {
    _values += obj
    obj
  }

  def values: List[T] = _values.toList
}
