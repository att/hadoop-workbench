package com.directv.hw.pool

import akka.actor.{Actor, ActorRef}
import com.typesafe.scalalogging.LazyLogging

import scala.collection.mutable
import scala.concurrent.{ExecutionContextExecutor, Future}
import scala.concurrent.duration._
import scala.language.postfixOps
import scala.util.Try

abstract class CachedRequestActorCompanion[STATUS, ID] {
  case class GetSyncStatus(id:ID)
}

abstract class CachedRequestActor[STATUS, ID](companion: CachedRequestActorCompanion[STATUS, ID]) extends Actor
  with LazyLogging {

  private val inProgress = mutable.Set.empty[ID]
  private val waitingSenders = mutable.Map.empty[ID, List[ActorRef]]
  private case class ResponseReceived(id: ID)

  private implicit val executor: ExecutionContextExecutor = context.system.dispatcher

  protected def requestStatus(id: ID): Future[Try[STATUS]]

  override def receive: PartialFunction[Any, Unit] = {

    case companion.GetSyncStatus(id) =>
      logger.trace(s"GetSyncStatus message received for $id")
      val senders = sender() :: waitingSenders.getOrElse(id, List.empty)
      waitingSenders.put(id, senders)
      requestUpdate(id)

    case ResponseReceived(id) =>
      logger.trace(s"Received update for $id")
      inProgress -= id

    case unknown => logger.error(s"unknown message [$unknown]")
  }

  private def requestUpdate(id: ID) = {
    if (!inProgress.contains(id)) {
      logger.trace(s"Request for $id was not found adding to queue...")
      scheduleUpdate(id)
      inProgress += id
    }
  }

  private def scheduleUpdate(id: ID): Unit = {
    logger.trace(s"Scheduling update for $id")
    context.system.scheduler.scheduleOnce(0 second)(updateStatus(id))
  }

  private def updateStatus(id: ID): Unit = {
    requestStatus(id).map { status =>
      self ! ResponseReceived(id)
      waitingSenders.get(id).foreach(_.foreach(_ ! status))
      waitingSenders -= id
    }
  }
}