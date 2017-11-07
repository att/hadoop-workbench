package com.directv.hw.hadoop.platform.status

import akka.actor.ActorRef
import com.directv.hw.hadoop.platform.model.ping.PingStatus
import com.directv.hw.hadoop.platform.service.PlatformManager
import com.directv.hw.pool.{CachedRequestActor, CachedRequestActorCompanion}
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}

import scala.concurrent.Future
import scala.util.Try

case class PingStatusActorHolder(actor: ActorRef)

object PingRequestActor extends CachedRequestActorCompanion[PingStatus, Int]

class PingRequestActor(implicit injector: Injector)
  extends CachedRequestActor[PingStatus, Int](PingRequestActor) with Injectable with LazyLogging {

  private val platformManager = inject[PlatformManager]

  override def requestStatus(id: Int): Future[Try[PingStatus]] = {
    logger.trace(s"request status invoked for platformId [$id]")
    platformManager.getPlatformStatus(id)
  }
}
