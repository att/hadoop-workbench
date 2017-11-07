package com.directv.hw.process

import com.typesafe.scalalogging.LazyLogging

import scala.sys.process.ProcessLogger

class InMemoryProcessLogger extends ProcessLogger with LazyLogging {

  private var _out: StringBuilder = new StringBuilder
  private var _err: StringBuilder = new StringBuilder
  private var _buffer = new StringBuilder

  override def out(s: => String) = {
    logger.debug(s"appending [$s]")
    _out.append(s)
  }
  override def buffer[T](f: => T): T = f
  override def err(s: => String) = _err.append(s)

  def getOut = _out.toString
  def getErr = _err.toString
}
