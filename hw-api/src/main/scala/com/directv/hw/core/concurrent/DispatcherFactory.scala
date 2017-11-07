package com.directv.hw.core.concurrent

import scala.concurrent.ExecutionContext

trait DispatcherFactory {
  def dispatcher: ExecutionContext
  def auxiliaryDispatcher: ExecutionContext
}
