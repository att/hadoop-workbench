package com.directv.hw.hadoop.platform.status

import com.directv.hw.hadoop.platform.model.{status => aggregated}
import scaldi.{Injectable, Injector}

import scala.concurrent.{ExecutionContext, Future}
import akka.pattern.ask
import akka.util.Timeout

import scala.concurrent.duration._
import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.platform.model.ping._
import com.directv.hw.hadoop.platform.model.status.Offline
import com.typesafe.scalalogging.LazyLogging

import scala.language.postfixOps
import scala.util.{Failure, Success, Try}

trait PlatformStatusService {
  def getStatus(platformId: Int): Future[Try[aggregated.PlatformStatus]]
}

class PlatformStatusServiceImpl(implicit injector: Injector) extends PlatformStatusService
  with Injectable with LazyLogging {

  private val pingStatusActor = inject[PingStatusActorHolder].actor
  private val appConf = inject[AppConf]

  private implicit val executor: ExecutionContext = inject[DispatcherFactory].dispatcher
  private implicit val timeout: Timeout = Timeout(appConf.outgoingHttpRqTimeoutMs millis)


  override def getStatus(platformId: Int): Future[Try[aggregated.PlatformStatus]] = {
    logger.trace(s"get platform status invoked for id [$platformId]")
    ping(platformId)
  }

  private def ping(platformId: Int, host: Option[String] = None): Future[Try[aggregated.PlatformStatus]] = {
    logger.trace(s"ping platform invoked with id [$platformId]")

    (pingStatusActor ? PingRequestActor.GetSyncStatus(platformId)).mapTo[Try[PingStatus]].map { status =>
      logger.trace(s"ping status [$status] for platformId [$platformId]")
      status match {
        case Success(PingSuccess) => Success(aggregated.Online(host))
        case Success(NoResponse) => Success(Offline(host))
        case Success(PingError(message)) => Success(aggregated.ErrorStatus(message))
        case Success(PingUnknown(message)) => Success(aggregated.UnknownStatus(message))
        case Failure(e) => Failure(e)
      }
    }
  }
}
