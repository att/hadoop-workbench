package com.directv.hw.core.concurrent

import akka.actor.ActorSystem
import com.directv.hw.core.service.HWConstants

import scala.concurrent.ExecutionContext

class DispatcherFactoryImpl(system: ActorSystem) extends DispatcherFactory {
  override val dispatcher: ExecutionContext = system.dispatcher
  override val auxiliaryDispatcher: ExecutionContext = system.dispatchers.lookup(HWConstants.auxDispatcherId)
}
