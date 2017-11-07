package com.directv.hw.core.http

import java.util.concurrent.atomic.AtomicLong

class RequestIdGeneratorImpl extends RequestIdGenerator {
  private val requestCounter = new AtomicLong

  override def nextRequestId(): Long = {
    val id = requestCounter.getAndIncrement()
    if (id < 0) Long.MaxValue - id else id
  }
}
