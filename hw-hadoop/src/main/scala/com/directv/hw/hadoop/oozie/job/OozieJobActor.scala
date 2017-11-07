package com.directv.hw.hadoop.oozie.job

import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.hadoop.oozie.client.{OozieClient, OozieClientRouter}
import com.directv.hw.hadoop.oozie.model.{JobPath, JobStatus, OozieJob}
import com.directv.hw.pool.{CachedRequestActor, CachedRequestActorCompanion}
import scaldi.{Injectable, Injector}

import scala.concurrent.{ExecutionContext, Future}
import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.persistence.dao.OozieWorkflowDao

import scala.util.{Failure, Success, Try}

abstract class OozieJobActorCompanion[T <: OozieJob] extends CachedRequestActorCompanion[List[T], JobPath] {
  val limitPerName = 50
}

abstract class OozieJobActor[T <: OozieJob](companion: OozieJobActorCompanion[T])(implicit injector: Injector)
  extends CachedRequestActor[List[T], JobPath](companion) with Injectable {

  private val oozieClientRouter = inject[OozieClientRouter]
  private val appConf = inject[AppConf]
  private val deploymentDao = inject[OozieWorkflowDao]

  private implicit val dispatcher: ExecutionContext = inject[DispatcherFactory].auxiliaryDispatcher

  protected def requestJobs(client: OozieClient)(name: String, statuses: List[JobStatus.Value], length: Option[Int] = None): List[T]
  protected def requestJob(client: OozieClient)(id: String): T

  override protected def requestStatus(id: JobPath): Future[Try[List[T]]] = {
    Future {
      try {
        Success(cacheJobs(id))
      } catch {
        case e: Throwable => Failure(e)
      }
    }
  }

  private def cacheJobs(jobPath: JobPath) = {
    val clusterPath = new ClusterPath(jobPath.platfromId, jobPath.clusterId)
    val deployment = deploymentDao.getWorkflow(clusterPath, jobPath.path)
    val team = deployment.team.orElse(Some(appConf.defaultTeam))
    val oozieClient = oozieClientRouter.getOozieClient(clusterPath, team)
    val running = requestJobs(oozieClient)(jobPath.name, List(JobStatus.running))
    val rest = requestJobs(oozieClient) (jobPath.name, List.empty, Some(companion.limitPerName + running.size))

    val runningIds = running.map(_.id).toSet
    running ::: rest.filter(job => !runningIds.contains(job.id))
  }
}