package com.directv.hw.hadoop.oozie.job

import com.directv.hw.hadoop.oozie.job.LogParser._

import scala.annotation.tailrec

object LogParser {
  def apply(log: String) = new LogParser(log)
  val newLinePattern = "^[\\d-.:;,\\s]+(TRACE|DEBUG|INFO|WARN|ERROR).*$"
}

class LogParser(log: String) {

  def actionLog(id: String): String = {
    collectActionLog(id, Vector.empty, log.split("\n").toList, previous = false)
  }


  @tailrec
  private def collectActionLog(id: String,
                       result: Vector[String],
                       log: List[String],
                       previous: Boolean): String = {

    log match {
      case a :: tail =>
        if (a.contains(id) || previous && !a.matches(newLinePattern)) {
          collectActionLog(id, result :+ a, tail, previous = true)
        } else {
          collectActionLog(id, result, tail, previous = false)
        }
      case Nil =>
        result.mkString("\n")
    }
  }
}
