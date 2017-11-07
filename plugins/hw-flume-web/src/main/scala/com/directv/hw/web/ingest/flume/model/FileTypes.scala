package com.directv.hw.web.ingest.flume.model

import com.directv.hw.hadoop.flume.service.FlumeFiles

object FileTypes {
  val flumeConf = "flume"
  val library = "lib"
  val config = "conf"
  val dir = "dir"

  val defaultType = library

  def fileType(path: String): String = path match {
    case FlumeFiles.flumeConf => flumeConf
    case s if s.endsWith("/") => dir
    case s if s.startsWith("lib/") => library
    case s if s.startsWith("conf/") => config
    case s if s.startsWith("properties/") => config
    case _ => defaultType
  }

}
