package com.directv.hw.hadoop.routing

import com.directv.hw.core.exception.CalleeException

trait VersionParser {

  private val FullVersionPattern = """(\d)(\.)(.*)""".r
  private val ShortVersionPattern = """(\d)""".r
  
  def majorVersion(version: String) = {
    version match {
      case FullVersionPattern(major, _, minor) => major
      case ShortVersionPattern(major) => major
      case _ => throw new CalleeException(s"Unknown platform version pattern - $version")
    }
  } 
}
