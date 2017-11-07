package com.directv.hw.hadoop.oozie.indexation

import akka.actor.Actor
import com.directv.hw.common.io.DapIoUtils._
import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.config.DescriptorConverter
import com.directv.hw.hadoop.hdfs.HdfsServiceFactory
import com.directv.hw.hadoop.hdfs.model.HdfsFileTypes
import com.directv.hw.hadoop.oozie.indexation.OozieIndexationWorker._
import com.directv.hw.hadoop.oozie.service.OozieDeploymentService
import com.directv.hw.hadoop.model.{ClusterPath, ComponentTypes, MetaFile}
import com.directv.hw.persistence.dao.OozieWorkflowDao
import com.directv.hw.persistence.entity.OozieWorkflowEntity
import com.typesafe.scalalogging.LazyLogging
import org.joda.time.DateTime
import scaldi.{Injectable, Injector}

object OozieIndexationWorker {
  case object Start
  case object Pause
  case object Stop
  case class Finished(clusterPath: ClusterPath)
  case class Failed(clusterPath: ClusterPath)
  case object NextIteration

  val maxPathLength = 50
}


class OozieIndexationWorker(clusterPath: ClusterPath, path: String, user: String)
                      (implicit injector: Injector) extends Actor with LazyLogging with Injectable {

  private val oozieService = inject[OozieDeploymentService]
  private val hdfsRouter = inject[HdfsServiceFactory]
  private val workflowDao = inject[OozieWorkflowDao]
  private val descriptorReader = inject[DescriptorConverter]
  private val appConf = inject[AppConf]
  private val hdfs = hdfsRouter.byTeam(clusterPath, appConf.defaultTeam)
  private val queue = new scala.collection.mutable.Queue[String]
  private val startTime = DateTime.now()

  override def preRestart(reason: Throwable, message: Option[Any]): Unit = {
    context.parent ! Failed(clusterPath)
  }

  override def receive: Receive = {
    case Start =>
      logger.debug(s"start oozie workflow indexation for $clusterPath Path=[$path]")
      queue.enqueue(path)
      context.become(started)
      runIndexIteration()
    case unknown => logger.error("worker is not started - " + unknown.getClass.getName)
  }

  private def started: Receive = {
    case NextIteration =>
      trace(s"Queue size: ${queue.size}")
      if (queue.nonEmpty) {
        trace("running next iteration ...")
        runIndexIteration()
        trace(s"Completed iteration")
      } else {
        trace(s"Finished indexing")
        finished()
      }

    case Stop =>
      logger.debug(s"stopping path oozie indexer for $clusterPath Path=[$path]")
      context.become(stopping)
      self ! Stop

    case unknown => logger.error("unknown message" + unknown.getClass.getName)
  }

  private def stopping: Receive = {
    case NextIteration => logger.trace("ignore iteration message in stopping state")
    case Stop => finished()
  }


  private def finished(): Unit = {
    logger.debug(s"oozie indexation is finished for $clusterPath Path=[$path]")
    oozieService.removeDeploymentsBefore(clusterPath, startTime)
    context.parent ! Finished(clusterPath)
  }

  private def log(message: String): Unit = logger.debug(s"Indexing [$clusterPath]: $message")
  private def trace(message: String): Unit = logger.trace(s"Indexing [$clusterPath]: $message")

  private def runIndexIteration(): Unit = {
    val path = queue.dequeue()
    log(s"Analyzing directory [$path]")
    if (path.count(_ == '/') >= maxPathLength) {
      log(s"path [$path] is too long, skipping")
    } else {
      try {
        val statuses = hdfs.listFiles(path)
        trace("Indexing folder:\n" + statuses.map(_.pathSuffix).mkString("\n"))
        val descriptorFound = statuses.exists { status =>
          status.pathSuffix == MetaFile.compDesc && status.`type` == HdfsFileTypes.file
        }

        if (descriptorFound) {
          trace(s"""Descriptor found in $path""")
          val descriptorJson = hdfs.getTextFile(s"$path/${MetaFile.compDesc}")
          val descriptor = descriptorReader.parse(descriptorJson)
          if (descriptor.`type` == ComponentTypes.oozie || descriptor.`type` == ComponentTypes.oozieWorkflow) {
            val wfPath = path.substring(0, path.lastIndexOf("/" + MetaFile.metaDir))
            val prev = workflowDao.findWorkflow(clusterPath, wfPath)
            val componentId = prev.flatMap(_.componentId)
            val env = prev.flatMap(_.env)
            val artifactId = descriptor.artifactId.orElse(descriptor.name).getOrElse("???")
            val version = descriptor.version.getOrElse("???")
            workflowDao.saveWorkflow {
              OozieWorkflowEntity(
                clusterPath.platformId,
                clusterPath.clusterId,
                wfPath,
                artifactId,
                version,
                env,
                DateTime.now(),
                componentId
              )
            }
          }
        } else {
          val dirs = statuses filter (_.`type` == HdfsFileTypes.directory)
          trace(s"""Dirs to add: [${dirs mkString ""}]""")
          dirs foreach { status =>
            val dirPath = concat(path, status.pathSuffix)
            trace(s"""Enqueuing [$dirPath]""")
            queue.enqueue(dirPath)
          }
        }
      } catch {
        case e: Throwable => logger.error("oozie indexation error", e)
      }
    }

    self ! NextIteration
  }
}