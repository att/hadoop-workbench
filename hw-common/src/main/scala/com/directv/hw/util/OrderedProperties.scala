package com.directv.hw.util

import java.util.Properties

import scala.collection.mutable

class OrderedProperties extends Properties {

  private val _orderedKeys = mutable.LinkedHashSet.empty[String]

  override def put(key: AnyRef, value: AnyRef): AnyRef = {

    if (!key.getClass.equals(classOf[String])) {
      throw new IllegalArgumentException("key must have String type")
    }

    if (!value.getClass.equals(classOf[String])) {
      throw new IllegalArgumentException("value must have String type")
    }

    synchronized {
      _orderedKeys.remove(key.toString)
      _orderedKeys.add(key.toString)
      super.put(key, value)
    }
  }

  def ordered = synchronized {
    _orderedKeys.toList.map { key =>
      (key, getProperty(key))
    }
  }
}
