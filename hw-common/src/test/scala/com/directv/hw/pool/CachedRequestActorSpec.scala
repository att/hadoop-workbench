package com.directv.hw.pool

import java.util.concurrent.atomic.AtomicInteger

import akka.actor.{ActorRef, ActorSystem, Props}
import org.scalatest.{BeforeAndAfterAll, FlatSpecLike, Matchers, OneInstancePerTest}
import akka.testkit.{ImplicitSender, TestKit}
import akka.pattern.ask
import akka.util.Timeout
import com.typesafe.scalalogging.LazyLogging

import scala.concurrent.duration._
import scala.concurrent.{Await, Future}
import scala.language.postfixOps
import scala.util.{Success, Try}

class CachedRequestActorSpec extends TestKit(ActorSystem(classOf[CachedRequestActorSpec].getSimpleName)) with ImplicitSender
  with FlatSpecLike with Matchers with BeforeAndAfterAll with LazyLogging with OneInstancePerTest {

  private implicit val executionContext = system.dispatcher
  private implicit val askTimeout = Timeout(10 seconds)

  object CachedRequestActor$ extends CachedRequestActorCompanion[String, String]

  class TestCachedRequestActor(request: String => Future[Try[String]]) extends CachedRequestActor[String, String](CachedRequestActor$) {
    override def requestStatus(id: String): Future[Try[String]] = request(id)
  }

  def createActor(request: String => Future[Try[String]]): ActorRef = {
    system.actorOf(Props(new TestCachedRequestActor(request)))
  }

  "actor" should "produce less external operations than internal poll requests" in {

    val externalCounter = new AtomicInteger
    val internalCounter = new AtomicInteger

    def update(id: String, actor: ActorRef) = {
      logger.trace("internal poll request")
      internalCounter.incrementAndGet()
      (actor ? CachedRequestActor$.GetSyncStatus(id)).mapTo[Try[String]]
    }

    def slowRequest(id: String) = Future {
      logger.trace("external poll request")
      externalCounter.incrementAndGet()
      Thread.sleep(200)
      Success("success")
    }

    val actor = createActor(slowRequest)

    val result1 = update("1", actor)
    val result2 = update("1", actor)
    val result3 = update("1", actor)

    val result = Future.reduce(List(result1, result2, result3)) {
      case (Success(_), Success(b)) => Success(b)
      case _ => throw new AssertionError("invalid response")
    }

    awaitCond(Await.result(result, 5 seconds).toOption.contains("success"), 5 seconds)

    logger.debug(s"internalCounter = $internalCounter")
    logger.debug(s"externalCounter = $externalCounter")
    internalCounter.get shouldBe 3
    externalCounter.get shouldBe 1
  }
}
