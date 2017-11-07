package com.directv.hw.core.http

trait RequestIdGenerator {
  def nextRequestId(): Long
}
