package com.directv.hw.core.validation

import com.directv.hw.core.exception.ServerError

object ValidationUtils {
  def ensureNonEmpty(s: String, name: String = ""): Unit = {
    if(s == null || s.isEmpty) {
      throw new ServerError(s"Illegal value: [$s] ${namePart(name)}")
    }
  }

  def ensureNonEmptyValue(o: Option[String], name: String = ""): Unit = {
    if(o.isEmpty) {
      throw new ServerError(s"Missing value ${namePart(name)}")
    }
    o foreach (s => ensureNonEmpty(s, name))
  }

  def ensureValidPort(p: Int, name: String = "") = {
    if(p < 0 || p > 65535) {
      throw new ServerError(s"Illegal value: [$p] ${namePart(name)}")
    }
  }

  private def namePart(name: String) = if(name.nonEmpty) s"for [$name]" else ""
}
