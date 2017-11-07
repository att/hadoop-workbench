package com.directv.hw.hadoop.oozie.indexation

import akka.actor.{Actor, ActorRef, Props}
import com.directv.hw.hadoop.oozie.model.OozieIndexation._
import com.directv.hw.hadoop.oozie.service.OozieDeploymentService
import com.directv.hw.hadoop.model.ClusterPath
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}
import scala.collection.mutable

class OozieIndexer(oozieService: OozieDeploymentService)(implicit injector: Injector) extends Actor
  with LazyLogging with Injectable {

  val workers = mutable.Map.empty[ClusterPath, ActorRef]

  override def receive: Receive = {
    case StartIndexation(clusterPath, path, user) =>
      if (!workers.contains(clusterPath)) {
        logger.debug(s"creating indexation worker for $clusterPath")
        val worker = context.actorOf(Props(new OozieIndexationWorker(clusterPath, path, user)))
        worker ! OozieIndexationWorker.Start
        workers += (clusterPath -> worker)
      } else {
        logger.warn("Indexation already started for " + clusterPath)
      }

    case IndexAllHds(user) =>
      oozieService.getAllHdfsPaths.foreach { path =>
        self ! StartIndexation(path, "/", user)
      }

    case OozieIndexationWorker.Finished(clusterPath) =>
      removeWorker(clusterPath)

    case OozieIndexationWorker.Failed(clusterPath) =>
      removeWorker(clusterPath)

    case GetStatus(clusterPath) =>
      val status = if (workers.contains(clusterPath)) Running else NotRunning
      sender() ! status

    case StopIndexation(clusterPath) =>
      logger.debug("trying to stop indexation worker - " + clusterPath)
      workers.get(clusterPath).foreach { worker =>
        logger.trace("sending message to stop indexation worker")
        worker ! OozieIndexationWorker.Stop
      }
  }

  def removeWorker(clusterPath: ClusterPath): Unit = {
    logger.debug(s"removing indexation worker for $clusterPath")
    workers.get(clusterPath).foreach { worker =>
      context.stop(worker)
    }

    workers -= clusterPath
  }
}
