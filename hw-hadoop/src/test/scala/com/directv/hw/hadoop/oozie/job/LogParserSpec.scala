package com.directv.hw.hadoop.oozie.job

import org.scalatest.FlatSpec

import scala.io.Source

class LogParserSpec extends FlatSpec {

  "parser" should "extract action errors" in {

    val is = getClass.getClassLoader.getResourceAsStream("oozie/log/shell-action-error.log")
    val log = Source.fromInputStream(is).mkString

    val actionLog = LogParser(log).actionLog("0000003-160328123234172-oozie-oozi-W@shell-action")
    println(actionLog)
  }
}
