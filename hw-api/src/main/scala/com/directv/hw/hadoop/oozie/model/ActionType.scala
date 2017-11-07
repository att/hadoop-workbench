package com.directv.hw.hadoop.oozie.model

import java.util.NoSuchElementException

import scala.language.implicitConversions

object ActionType extends Enumeration {
  val shell = Value("shell")
  val fs = Value("fs")
  val java = Value("java")
  val distcp = Value("distcp")
  val email = Value("email")
  val hive = Value("hive")
  val mr = Value("map-reduce")
  val mr2 = Value("map-reduce2")
  val sqoop = Value("sqoop")
  val ssh = Value("ssh")
  val spark = Value("spark")
  val unknown = Value("unknown")


  implicit def fromString(`type`: String): ActionType.Value = {
    try {
      withName(`type`)
    } catch {
      case e: NoSuchElementException => unknown
    }
  }
}
