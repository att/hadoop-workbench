package com.directv.hw.hadoop.yarn

import akka.http.scaladsl.model.HttpMethods
import akka.http.scaladsl.model.headers.Location
import com.directv.hw.core.exception.ConfigurationException
import com.directv.hw.hadoop.http.client.{HttpClientDispatcher, HttpClientException, HttpClientResponse}
import com.directv.hw.hadoop.mapred.{JobLog, JobLogTraces}
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.persistence.dao.ClusterServiceDao
import org.jsoup.Jsoup
import scaldi.Injector
import YarnClientImpl._
import com.directv.hw.hadoop.config.ClusterServiceNames
import com.directv.hw.hadoop.yarn.exception.YarnAccessException

import scala.collection.JavaConversions._
import scala.concurrent.Future

trait YarnClient {
  def jobLog(clusterPath: ClusterPath, jobId: String): Future[List[JobLog]]
}

object YarnClientImpl {
  private val ChildJobPattern = """^.*Submitted application application_([0-9_]+)$""".r
}

class YarnClientImpl(implicit injector: Injector) extends HttpClientDispatcher with YarnClient with YarnJsonFormats {

  private val clusterServiceDao = inject[ClusterServiceDao]

  override def jobLog(clusterPath: ClusterPath, jobId: String): Future[List[JobLog]] = {
    val appUrl = s"${resolveResourceUrl(clusterPath)}/apps/application_$jobId"
    dispatchRq[ApplicationRespWrapper](HttpMethods.GET, appUrl).flatMap { appWrapper =>
      val app = appWrapper.body.get.app
      val user = app.user
      val appType = app.applicationType

      logger.debug(s"getting yarn logs for application id: [$jobId] launched by user: [$user]")
      val logResp = app.state match {
        case "NEW" | "SUBMITTED" | "RUNNING" =>
          logger.debug("Job is not finished. Retrieving logs from mapred api.")
          retrieveLog(jobId, user, resolveMapredUrl(clusterPath, jobId), isSilent = false)
        case _ =>
          logger.debug("Job is finished. Retrieving logs from history server")
          retrieveLog(jobId, user, resolveHistoryUrl(clusterPath), isSilent = true)
      }

      logResp.flatMap {
        case None =>
          Future(List.empty)
        case Some(log) =>
          retrieveChildLog(clusterPath, jobId, log.stdOut).map { childLog =>
            List(Some(JobLog(appType, log)), childLog).flatten
          }
      }
    }.recover {
      case e: HttpClientException => throw new YarnAccessException("job log error", e)
    }
  }

  private def retrieveChildLog(clusterPath: ClusterPath, parentJobId: String, parentLog: String): Future[Option[JobLog]] = {
    logger.debug("retrieving child job log")
    val childLogs = parentLog.split("\n").collectFirst {
      case ChildJobPattern(jobId) =>
        logger.debug(s"Found child job $jobId for $parentJobId")
        val url = s"${resolveResourceUrl(clusterPath)}/apps/application_$jobId"
        dispatchRq[ApplicationRespWrapper](HttpMethods.GET, url).flatMap { appWrapper =>
          val app = appWrapper.body.get.app
          retrieveChildLogTraces(clusterPath, jobId).map { _.map(JobLog(app.applicationType, _)) }
        }
    }

    childLogs.getOrElse {
      logger.debug(s"No child job for $parentJobId")
      Future(None)
    }.recover {
      case e: Exception =>
        logger.error("child job log error", new YarnAccessException("job log error", e))
        None
      case e => throw new YarnAccessException("child job log error", e)
    }
  }

  private def retrieveChildLogTraces(clusterPath: ClusterPath, jobId: String): Future[Option[JobLogTraces]] = {
    val appUrl = s"${resolveResourceUrl(clusterPath)}/apps/application_$jobId/appattempts"
    dispatchRq[AppAttemptsWrapper](HttpMethods.GET, appUrl).flatMap { attemptsWrapper =>
      val attempts = attemptsWrapper.body.get.appAttempts.appAttempt
      logger.debug(s"Found ${attempts.size} attempts for job  $jobId")
      val attempt = attempts.sortWith(_.startTime > _.startTime).head
      logger.debug(s"Last attempt id: ${attempt.id} for job: $jobId)")
      requestAttemptLog(attempt.logsLink)
    }
  }

  private def retrieveLog(jobId: String,
                         user: String,
                         baseUrl: String,
                         isSilent: Boolean): Future[Option[JobLogTraces]] = {

    dispatchRq[JobTasksWrapper](HttpMethods.GET, s"$baseUrl/jobs/job_$jobId/tasks").flatMap { tasksWrapper =>
        val tasks = tasksWrapper.body.get.tasks.task
        logger.debug(s"Found ${tasks.size} tasks for yarn job $jobId")
        val logs = tasks.map { task => requestTaskLog(baseUrl, jobId, user, task.id) }
        Future.reduce(logs) {
          case (Some(log1), Some(log2)) =>
            Some(
              log1.copy(
                stdOut = log1.stdOut + log2.stdOut,
                stdErr = log1.stdErr + log2.stdErr,
                syslog = log1.syslog + log2.syslog
              )
            )

          case (Some(log1), None) => Some(log1)
          case (None, Some(log2)) => Some(log2)
          case _ => None
        }

    }.recover {
      case e =>
        val ex = new YarnAccessException("job log error", e)
        if (isSilent) {
          logger.error(ex.getMessage, ex)
          None
        } else {
          throw ex
        }
    }
  }

  private def requestTaskLog(baseUrl: String,
                             jobId: String,
                             user: String,
                             jobTaskId: String): Future[Option[JobLogTraces]] = {

    val url = s"$baseUrl/jobs/job_$jobId/tasks/$jobTaskId/attempts"
    dispatchRq[TaskAttemptsWrapper](HttpMethods.GET, url).flatMap { atteptsWrapper =>
      val attempts = atteptsWrapper.body.get.taskAttempts.taskAttempt
      logger.debug(s"Found ${attempts.size} attempts for yarn job task $jobTaskId")
      val attempt = attempts.sortWith(_.startTime > _.startTime).head
      logger.debug(s"Last attempt id: ${attempt.id} for task: $jobTaskId)")
      requestAttemptLog(s"http://${attempt.nodeHttpAddress}/node/containerlogs/${attempt.assignedContainerId}/$user")
    }
  }

  private def requestAttemptLog(logUrl: String): Future[Option[JobLogTraces]] = {
    dispatchRawRq(HttpMethods.GET, logUrl).flatMap { redirect =>
      logger.debug("Trying to find redirect url")
      parseRedirectUrl(redirect) match {
        case Some(url) =>
          logger.debug(s"Found redirect url: $url")
          requestJobLog(url)
        case None =>
          logger.debug(s"Redirect url was not found. Using initial url: $logUrl")
          requestJobLog(logUrl)
      }
    }
  }

  private def requestJobLog(url: String): Future[Option[JobLogTraces]] = {
    dispatchRawRq(HttpMethods.GET, url + "/stdout?start=0").flatMap { rawStdOutLog =>
      dispatchRawRq(HttpMethods.GET, url + "/stderr?start=0").flatMap { rawStdErrLog =>
        dispatchRawRq(HttpMethods.GET, url + "/syslog?start=0").map { rawSysLog =>
          val stdOut = extractLog(rawStdOutLog.body.get)
          val stdErr = extractLog(rawStdErrLog.body.get)
          val sysLog = extractLog(rawSysLog.body.get)
          Some(JobLogTraces(stdOut, stdErr, sysLog))
        }
      }
    }
  }

  private def resolveHistoryUrl(clusterPath: ClusterPath): String = {
    val url = clusterServiceDao.findService(clusterPath, ClusterServiceNames.jobHistory).map(_.url).getOrElse {
      throw ConfigurationException("couldn't resolve job history server url")
    }

    url + "/ws/v1/history/mapreduce"
  }

  private def resolveResourceUrl(clusterPath: ClusterPath): String = {
    resolveResourceManagerAccess(clusterPath) + "/ws/v1/cluster"
  }

  private def resolveMapredUrl(clusterPath: ClusterPath, applicationId: String): String = {
    resolveResourceManagerAccess(clusterPath) + s"/proxy/application_$applicationId/ws/v1/mapreduce"
  }

  private def resolveResourceManagerAccess(clusterPath: ClusterPath): String = {
    clusterServiceDao.findService(clusterPath, ClusterServiceNames.resourceManager).map(_.url).getOrElse {
      throw ConfigurationException("caouldn't resolve resource manager url")
    }
  }

  private def parseRedirectUrl(redirect: HttpClientResponse[Option[String]]): Option[String] = {
    redirect.status.intValue() match {
      case 307 =>
        redirect.headers.collectFirst { case Location(uri) => uri.toString }
      case 200 =>
        val redirectPage = redirect.body.get
        val head = Jsoup.parse(redirectPage).head
        val refreshTag = head.children.find {
          element => element.tag.getName == "meta" && element.attr("http-equiv") == "refresh"
        }

        val urlAttr = refreshTag.map(_.attr("content")).flatMap { content =>
          content.split(";").find(_.contains("url="))
        }

        urlAttr.map(_.split("=")(1)) match {
          case Some(url) if url.isEmpty => None
          case url => url
        }

      case _ => None
    }
  }

  private def extractLog(html: String): String = {
    try {
      logger.debug("Extracting log from HTML page")
      val body = Jsoup.parse(html).body
      val table = body.children.find(_.tag.getName == "table").get
      val tbody = table.children.find(_.tag.getName == "tbody").get
      val tr = tbody.children.find(_.tag.getName == "tr").get
      val content = tr.children.find(_.attr("class") == "content").get
      content.children.find(_.tag.getName == "pre").get.text
    } catch {
      case e: Exception =>
        logger.error("unable to parse log file", e)
        ""
    }
  }
}