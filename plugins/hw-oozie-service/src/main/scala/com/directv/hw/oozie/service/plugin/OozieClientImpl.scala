package com.directv.hw.oozie.service.plugin

import com.directv.hw.core.exception.{DapException, ServerError}
import com.directv.hw.hadoop.config.{ConfigConverter, ConfigEntry}
import com.directv.hw.hadoop.oozie.client.OozieClient
import com.directv.hw.hadoop.oozie.model.{OozieJobType, _}
import com.directv.hw.oozie.service._
import com.typesafe.scalalogging.LazyLogging
import org.joda.time.format.DateTimeFormat
import org.springframework.http.{HttpEntity, HttpHeaders, MediaType}
import org.springframework.web.client.HttpClientErrorException

import scala.collection.JavaConversions._
import scala.language.postfixOps

//TODO: vvozdroganov - custom gson converters, xml marshaller
class OozieClientImpl(restTemplate: DapRestTemplate, oozieUrl: String, user: String, configConverter: ConfigConverter)
  extends OozieClient with LazyLogging {

  override def getWorkflowJobs(name: Option[String],
                               offset: Option[Int],
                               len: Option[Int],
                               statuses: List[JobStatus.Value]): List[WorkflowJob] = {
    val jobsResponse = getJobs(name, offset, len, statuses)("wf")
    jobsResponse.workflows.map(toServiceModel(_, oozieTimeDiff)).toList
  }

  override def getCoordinatorJobs(name: Option[String],
                                  offset: Option[Int],
                                  len: Option[Int],
                                  statuses: List[JobStatus.Value]): List[CoordinatorJob] = {
    val jobsResponse = getJobs(name, offset, len, statuses)("coordinator")
    jobsResponse.coordinatorjobs.map(toServiceModel(_, oozieTimeDiff)).toList
  }

  private def getJobs(name: Option[String],
                      offset: Option[Int],
                      len: Option[Int],
                      statuses: List[JobStatus.Value])(jobType: String): plugin.model.Jobs = {

    val baseUrl = s"$oozieUrl/v1/jobs?jobtype=$jobType&"
    val nameParam = name.map(n => s"name=$n")
    val statusParams = statuses.map(s => s"status=$s")
    val filterParams = List(nameParam).flatten ::: statusParams
    val filter = if(filterParams.nonEmpty) Some(s"filter=${filterParams.mkString(";")}") else None
    val offsetParam = offset.map(o => s"offset=$o")
    val lenParam = len.map(l => s"len=$l")
    val url = baseUrl + List(filter, offsetParam, lenParam).flatten.mkString("&")

    restTemplate.getForObject(url, classOf[plugin.model.Jobs])
  }

  override def getWorkflowJob(jobId: String): WorkflowJob = {
    withExceptionHandler {
      val job = requestWorkflowJob(jobId)
      toServiceModel(job, oozieTimeDiff)
    }
  }

  def getCoordinatorJob(jobId: String): CoordinatorJob = {
    withExceptionHandler {
      val job = requestCoordinatorJob(jobId)
      toServiceModel(job, oozieTimeDiff)
    }
  }

  override def getJobDefinition(jobId: String): String = {
    withExceptionHandler {
      val url = s"$oozieUrl/v1/job/$jobId?show=definition"
      restTemplate.getForObject(url, classOf[String])
    }
  }

  override def getJobLog(jobId: String): String = {
    withExceptionHandler {
      val url = s"$oozieUrl/v1/job/$jobId?show=log"
      restTemplate.getForObject(url, classOf[String])
    }
  }

  override def createJob(hdfsUrl: String, appPath: String, start: Boolean, properties: List[ConfigEntry] = List.empty, jobType: OozieJobType.Value): OozieJobId = {

    val url =  if (start) {
      s"$oozieUrl/v1/jobs?action=start"
    } else {
      s"$oozieUrl/v1/jobs"
    }

    val rqBody = makeConfigString(hdfsUrl, user, appPath, properties, jobType)

    withExceptionHandler {
      val jobId = restTemplate.postForObject(url, xmlEntity(rqBody), classOf[plugin.model.JobId])
      OozieJobId(jobId.id)
    }
  }

  override def startJob(jobId: String, hdfsUrl: String, appPath: String): Unit = {
    withExceptionHandler {
      manageJobRq(jobId, hdfsUrl, appPath, user, "start")
    }
  }

  override def suspendJob(jobId: String, hdfsUrl: String, appPath: String): Unit = {
    withExceptionHandler {
      manageJobRq(jobId, hdfsUrl, appPath, user, "suspend")
    }
  }

  override def resumeJob(jobId: String, hdfsUrl: String, appPath: String): Unit = {
    withExceptionHandler {
      manageJobRq(jobId, hdfsUrl, appPath, user, "resume")
    }
  }

  override def killJob(jobId: String, hdfsUrl: String, appPath: String): Unit = {
    withExceptionHandler {
      manageJobRq(jobId, hdfsUrl, appPath, user, "kill")
    }
  }

  override def dryrunJob(jobId: String, hdfsUrl: String, appPath: String): Unit = {
    withExceptionHandler {
      manageJobRq(jobId, hdfsUrl, appPath, user, "dryrun")
    }
  }

  override def rerunJob(jobId: String, hdfsUrl: String, appPath: String): Unit = {
    withExceptionHandler {
      restartJobRq(jobId, hdfsUrl, appPath, user, "rerun")
    }
  }

  override def changeJob(jobId: String, hdfsUrl: String, appPath: String): Unit = {
    withExceptionHandler {
      restartJobRq(jobId, hdfsUrl, appPath, user, "change")
    }
  }

  private def oozieTimeDiff: Long = {
    val remoteTime = restTemplate.headForHeaders(oozieUrl).getDate
    System.currentTimeMillis() - remoteTime
  }

  private def requestWorkflowJob(jobId: String): plugin.model.WorkflowJob = {
    val url = s"$oozieUrl/v1/job/$jobId"
    withExceptionHandler {
      restTemplate.getForObject(url, classOf[plugin.model.WorkflowJob])
    }
  }

  private def requestCoordinatorJob(jobId: String): plugin.model.CoordinatorJob = {
    val url = s"$oozieUrl/v1/job/$jobId"
    withExceptionHandler {
      restTemplate.getForObject(url, classOf[plugin.model.CoordinatorJob])
    }
  }

  private def xmlEntity(rqBody: String): HttpEntity[String] = {
    val headers = new HttpHeaders
    headers.setContentType(MediaType.APPLICATION_XML)
    val entity = new HttpEntity[String](rqBody, headers)
    entity
  }

  private def toServiceModel(job: plugin.model.WorkflowJob, timeDiff: Long): WorkflowJob = {

    WorkflowJob (
      job.id,
      job.appName,
      Option(job.appPath),
      job.user,
      job.status,
      job.createdTime,
      Option(job.startTime),
      Option(job.endTime),
      job.run,
      job.actions.toList.map(toServiceModel(_, timeDiff)),
      Option(job.parentId),
      Option(job.externalId),
      Map.empty,
      runningTime(Option(job.startTime), Option(job.endTime), timeDiff)
    )
  }

  private def toServiceModel(job: plugin.model.CoordinatorJob, timeDiff: Long): CoordinatorJob = {

    CoordinatorJob (
      id = job.coordJobId,
      appName = job.coordJobName,
      appPath = Option(job.coordJobPath),
      externalId = Option(job.coordExternalId),
      user = job.user,
      createdTime = job.startTime,
      startTime = Option(job.startTime),
      endTime = Option(job.endTime),
      timeUnit = job.timeUnit,
      nextMaterializedTime = Option(job.nextMaterializedTime),
      status = job.status,
      frequency = job.frequency,
      lastAction = Option(job.lastAction),
      timeOut = job.timeOut
    )
  }

  private def runningTime(startTime: Option[String], endTime: Option[String], timeDiff: Long): Option[Long] = {
    val dateParser = DateTimeFormat.forPattern("EEE, dd MMM yyyy HH:mm:ss z")
    startTime.map { start =>
      val startInMs = dateParser.parseMillis(start)
      val endInMs = endTime match {
        case Some(end) => dateParser.parseMillis(end)
        case None => System.currentTimeMillis - timeDiff
      }

      val runningTime = endInMs - startInMs
      if (runningTime > 0) runningTime
      else 0
    }
  }

  private def toServiceModel(action: plugin.model.Action, timeDiff: Long): OozieAction = {
    OozieAction (
      action.id,
      action.name,
      action.`type`,
      Option(action.startTime),
      Option(action.endTime),
      Option(action.externalId),
      action.status,
      Option(action.transition),
      Option(action.errorCode),
      Option(action.errorMessage),
      action.retries,
      runningTime(Option(action.startTime), Option(action.endTime), timeDiff)
    )
  }

  private def manageJobRq(jobId: String, hdfsUrl: String, appPath: String, user: String, action: String): Unit = {
    val url = s"$oozieUrl/v1/job/$jobId?action=$action&user.name=$user"
    val rqBody =  makeConfigString(hdfsUrl, user, appPath)
    withExceptionHandler {
      restTemplate.put(url, xmlEntity(rqBody))
    }
  }

  private def restartJobRq(jobId: String, hdfsUrl: String, appPath: String, user: String, action: String, properties: List[ConfigEntry] = List.empty): Unit = {
    val url = s"$oozieUrl/v1/job/$jobId?action=$action&user.name=$user"
    val rqBody =  makeConfigString(hdfsUrl, user, appPath, properties)
    withExceptionHandler {
      restTemplate.put(url, xmlEntity(rqBody))
    }
  }

  private def makeConfigString(hdfsUrl: String,
                               user: String,
                               appPath: String,
                               properties: List[ConfigEntry] = List.empty,
                               jobtype: OozieJobType.Value = OozieJobType.workflow): String = {

    val appPathEntry = jobtype match {
      case OozieJobType.workflow => ConfigEntry("oozie.wf.application.path", s"$appPath")
      case OozieJobType.coordinator => ConfigEntry("oozie.coord.application.path", s"$appPath")
    }

    val userEntry = ConfigEntry("user.name", user)
    val explicitProperties = List(userEntry, appPathEntry)
    configConverter.toConfigXml(explicitProperties ++ properties)
  }

  private def withExceptionHandler [T] (action: => T): T = {
    try {
      action
    } catch {
      case exception: Exception =>
        def convertToDapException: Throwable => Option[DapException] = {
          case e: HttpClientErrorException =>
            val messages = e.getResponseHeaders.get("oozie-error-message")
            // TODO: vvozdroganov - throw this kind of exceptions at the WEB layer
            val message = "oozie server error" + (if (messages != null) ":\n" + messages.mkString("\n") else "")
            Some(new ServerError(message, exception))
          case e: Throwable =>
            Option(e.getCause) flatMap convertToDapException
        }

        throw convertToDapException(exception) getOrElse exception
    }
  }

}
