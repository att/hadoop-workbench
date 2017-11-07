package com.directv.hw.hadoop.oozie.service

import java.nio.file.Path

import akka.actor.ActorRef
import com.directv.hw.hadoop.config.{ClusterServiceNames, ConfigEntry, DescriptorConverter}
import com.directv.hw.hadoop.oozie.client.OozieClientRouter
import com.directv.hw.hadoop.oozie.model._
import com.directv.hw.hadoop.model.{ClusterPath, HdfsPath}
import com.directv.hw.hadoop.oozie.job._
import com.directv.hw.persistence.dao.{ClusterServiceDao, OozieWorkflowDao}
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}
import akka.pattern.ask
import akka.stream.scaladsl.FileIO

import scala.concurrent.duration._
import scala.language.postfixOps
import akka.util.Timeout
import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.core.exception.ConfigurationException
import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.access.AccessManagerService
import com.directv.hw.hadoop.hdfs.{HdfsService, HdfsServiceFactory}

import scala.concurrent.{ExecutionContext, Future}
import scala.language.postfixOps
import scala.util.{Failure, Success, Try}

class OozieRuntimeServiceImpl(implicit injector: Injector) extends OozieRuntimeService with Injectable
  with LazyLogging {

  private val clientRouter = inject[OozieClientRouter]
  private val converter = inject[OozieFilesConverter]
  private val deploymentService = inject[OozieDeploymentService]
  private val hdfsFactory = inject[HdfsServiceFactory]
  private val deploymentDao = inject[OozieWorkflowDao]
  private val workflowJobActor = inject[WorkflowJobActorHolder].actor
  private val coordinatorJobActor = inject[CoordinatorJobActorHolder].actor
  private val descriptorConverter = inject[DescriptorConverter]
  private val clusterServiceDao = inject[ClusterServiceDao]
  private val appConf = inject[AppConf]
  private val accessManager = inject[AccessManagerService]
  private val dispatcherFactory = inject[DispatcherFactory]

  private implicit val executor: ExecutionContext = dispatcherFactory.auxiliaryDispatcher

  override def getWorkflowJobs(hdfsPath: HdfsPath, user: String): Future[List[WorkflowJob]] = {
    requestWorkflowJobs(hdfsPath, user)
  }

  override def getCoordinatorJobs(hdfsPath: HdfsPath, user: String): Future[List[CoordinatorJob]] = {
    requestCoordinatorJobs(hdfsPath, user)
  }

  private def requestWorkflowJobs(hdfsPath: HdfsPath, user: String): Future[List[WorkflowJob]] = {
    requestJobs(hdfsPath, user)(workflowJobActor, WorkflowJobActor.GetSyncStatus)
  }

  private def requestCoordinatorJobs(hdfsPath: HdfsPath, user: String): Future[List[CoordinatorJob]] = {
    requestJobs(hdfsPath, user)(coordinatorJobActor, CoordinatorJobActor.GetSyncStatus)
  }

  private def collectStatistics(jobs: List[OozieJob]): JobStatistics = {
    jobs.foldLeft(JobStatistics(0,0,0,0)) { (statistics, job) =>
      JobStatus.fromString(job.status) match {
        case JobStatus.running => statistics.copy(running = statistics.running + 1)
        case JobStatus.failed => statistics.copy(failed = statistics.failed + 1)
        case JobStatus.succeeded => statistics.copy(succeeded = statistics.succeeded + 1)
        case _ => statistics.copy(other = statistics.other + 1)
      }
    }
  }

  override def getWorkflowJobStatistics(hdfsPath: HdfsPath, user: String): Future[JobStatistics] = {
    requestWorkflowJobs(hdfsPath, user).map(collectStatistics)
  }

  override def getCoordinatorJobStatistics(hdfsPath: HdfsPath, user: String): Future[JobStatistics] = {
    requestCoordinatorJobs(hdfsPath, user).map(collectStatistics)
  }

  private def requestJobs[T <: OozieJob](hdfsPath: HdfsPath, user: String)
    (jobActor: ActorRef, message: (JobPath) => OozieJobActorCompanion[T]#GetSyncStatus): Future[List[T]] = {

    implicit val executionTimeout: Timeout = Timeout(appConf.outgoingHttpRqTimeoutMs millis)
    val jobPath = JobPath(hdfsPath.platformId, hdfsPath.clusterId, hdfsPath.path, composeJobName(hdfsPath, user))
    (jobActor ? message(jobPath)).mapTo[Try[List[T]]].map {
      case Success(jobs) => jobs
      case Failure(e) => throw e
    }
  }

  private def composeJobName(hdfsPath: HdfsPath, user: String) = {
    val info = deploymentService.getDeploymentInfo(hdfsPath, hdfsPath.path, user)
    List(info.env, Some(info.name), Some(info.version)).flatten.mkString(":")
  }

  override def killJobs(clusterPath: ClusterPath, appPath: String, user: String, jobType: OozieJobType.Value): Future[Unit] = {
    val hdfsPath = clusterPath.toHdfsPath(appPath)
    val result = jobType match {
      case OozieJobType.workflow =>
        requestJobs(hdfsPath, user)(workflowJobActor, WorkflowJobActor.GetSyncStatus).map { jobs =>
          killRunningJobs(jobs, clusterPath, appPath, user)
        }

      case OozieJobType.coordinator =>
        requestJobs(hdfsPath, user)(coordinatorJobActor, CoordinatorJobActor.GetSyncStatus).map { jobs =>
          killRunningJobs(jobs, clusterPath, appPath, user)
        }
    }

    result
  }

  private def killRunningJobs[T <: OozieJob](jobs: List[T], clusterPath: ClusterPath, appPath: String, user: String): Unit = {
    jobs.filter { job => job.status == JobStatus.running.toString }.foreach { job =>
      client(clusterPath, user, Some(appPath)).killJob(job.id, hdfsUrl(clusterPath), appPath)
    }
  }

  override def getJob(clusterPath: ClusterPath, jobId: String, user: String): OozieJob = {
    jobId match {
      case id if id.endsWith("W") => client(clusterPath, user).getWorkflowJob(jobId)
      case id if id.endsWith("C") => client(clusterPath, user).getCoordinatorJob(jobId)
      case id => throw new IllegalArgumentException(s"unknown job type: $id")
    }
  }

  override def getJobDefinition(clusterPath: ClusterPath, jobId: String, user: String): WorkflowGraph = {

    val xml = client(clusterPath, user).getJobDefinition(jobId)
    converter.parseWorkflowXml(xml)
  }

  override def createJob(clusterPath: ClusterPath, appPath: String, user: String, jobType: OozieJobType.Value): OozieJobId = {

    def create(properties: List[ConfigEntry]) = client(clusterPath, user, Some(appPath)).createJob (
      hdfsUrl(clusterPath),
      appPath,
      start = true,
      properties,
      jobType
    )

    val deployment = deploymentDao.getWorkflow(clusterPath, appPath)
    val team = deployment.team.getOrElse {
      throw ConfigurationException("team is not defined in component descriptor")
    }

    val hdfs = hdfsClient(clusterPath, user, team)
    val (principal, key) = accessManager.getTeamCreds(clusterPath, team)
    val hdfsKey = copyKeyToHdfs(hdfs, appPath, team, key).getOrElse("none")

    val principalEntry = ConfigEntry("principal", principal)
    val keytabEntry = ConfigEntry("keytab", hdfsKey)
    val appNameEntry = ConfigEntry("appName", resolveJobName(hdfs, clusterPath, appPath))
    val runtimeProperties = List(appNameEntry, principalEntry, keytabEntry)

    val properties = hdfs.tryTextFile(s"$appPath/conf/job-config.xml").map(converter.parseConfig)
      .orElse(hdfs.tryTextFile(s"$appPath/conf/job.properties").map(converter.toProperties))
      .map(runtimeProperties ::: _).getOrElse(runtimeProperties)

    logger.debug(s"Oozie runtime properties for [$appPath]:" +
      runtimeProperties.map(prop => s"${prop.key}:${prop.value}").mkString(","))

    val jobId = create(properties)
    jobId
  }

  private def copyKeyToHdfs(hdfs: HdfsService, appPath: String, team: String, key: Option[Path]): Option[String] = {
    key.map { localKey =>
      val hdfsKey = s"$appPath/keys/$team.keytab"
      hdfs.uploadFile(hdfsKey, FileIO.fromPath(localKey))
      hdfsKey
    }
  }

  private def resolveJobName(hdfs: HdfsService, clusterPath: ClusterPath, appPath: String) = {
    val descriptorJson = hdfs.getTextFile(s"$appPath/${OozieFiles.descriptor}")
    val descriptor = descriptorConverter.parse(descriptorJson)
    val name = descriptor.artifactId.orElse(descriptor.name).getOrElse {
      throw ConfigurationException("artifactId is not specified in component descriptor")
    }

    val version = descriptor.version.getOrElse {
      throw ConfigurationException("version is not specified in component descriptor")
    }

    val env = deploymentDao.findWorkflow(clusterPath, appPath).flatMap(_.env)

    List(env, Some(name), Some(version)).flatten.mkString(":")
  }

  override def startJob(clusterPath: ClusterPath, appPath: String, jobId: String, user: String): Unit = {
    client(clusterPath, user, Some(appPath)).startJob(jobId, hdfsUrl(clusterPath), appPath)
  }

  override def resumeJob(clusterPath: ClusterPath, appPath: String, jobId: String, user: String): Unit = {
    client(clusterPath, user, Some(appPath)).resumeJob(jobId, hdfsUrl(clusterPath), appPath)
  }

  override def suspendJob(clusterPath: ClusterPath, appPath: String, jobId: String, user: String): Unit = {
    client(clusterPath, user, Some(appPath)).suspendJob(jobId, hdfsUrl(clusterPath), appPath)
  }

  override def rerunJob(clusterPath: ClusterPath, appPath: String, jobId: String, user: String): Unit = {
    client(clusterPath, user, Some(appPath)).rerunJob(jobId, hdfsUrl(clusterPath), appPath)
  }

  override def killJob(clusterPath: ClusterPath, appPath: String, jobId: String, user: String): Unit = {
    client(clusterPath, user, Some(appPath)).killJob(jobId, hdfsUrl(clusterPath), appPath)
  }

  override def dryrunJob(clusterPath: ClusterPath, appPath: String, jobId: String, user: String): Unit = {
    client(clusterPath, user, Some(appPath)).dryrunJob(jobId, hdfsUrl(clusterPath), appPath)
  }

  override def changeJob(clusterPath: ClusterPath, appPath: String, jobId: String, user: String): Unit = {
    client(clusterPath, user, Some(appPath)).changeJob(jobId, hdfsUrl(clusterPath), appPath)
  }

  private def client(clusterPath: ClusterPath, user: String, appPath: Option[String] = None) = {
    val team = appPath.flatMap(deploymentDao.getWorkflow(clusterPath, _).team).orElse(Some(appConf.defaultTeam))
    clientRouter.getOozieClient(clusterPath, team)
  }

  private def hdfsClient(clusterPath: ClusterPath, user: String, team: String) = {
    hdfsFactory.byTeam(clusterPath, team)
  }

  private def hdfsUrl(clusterPath: ClusterPath): String = {
    clusterServiceDao.findService(clusterPath, ClusterServiceNames.nameNode).map(_.url).getOrElse {
      throw ConfigurationException("Couldn't resolve oozie url")
    }
  }
}
