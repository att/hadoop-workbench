package com.directv.hw.common.io

import java.io.{BufferedReader, StringReader}

import org.scalatest.{FlatSpec, Matchers}

class SimpleLogParserSpec extends FlatSpec with Matchers{

  "parser" should "parse log" in {
    val parts = List("2001 ab", "2002 cd\n at def\n\tat gh", "2003 ijk\n     lm", "[o]")
    val asString = parts.mkString("\n")
    val parsed = SimpleLogParser.toEntries(new BufferedReader(new StringReader(asString))).toList
    parsed should be (parts)
  }

}
