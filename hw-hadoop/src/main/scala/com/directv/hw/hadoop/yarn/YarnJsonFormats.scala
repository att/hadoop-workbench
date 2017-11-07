package com.directv.hw.hadoop.yarn

import spray.httpx.SprayJsonSupport
import spray.httpx.marshalling.MetaMarshallers
import spray.json.DefaultJsonProtocol

trait YarnJsonFormats extends DefaultJsonProtocol with MetaMarshallers {
  implicit val appAttemptFormat = jsonFormat5(AppAttempt)
  implicit val appAttemptsFormat = jsonFormat1(AppAttempts)
  implicit val appAttemptsWrapperFormat = jsonFormat1(AppAttemptsWrapper)
  implicit val applicationRespFormat = jsonFormat5(ApplicationResp)
  implicit val wrapperFormat = jsonFormat1(ApplicationRespWrapper)
  implicit val jobTaskFormat = jsonFormat8(JobTask)
  implicit val jobTasksFormat = jsonFormat1(JobTasks)
  implicit val jobTasksWrapperFormat = jsonFormat1(JobTasksWrapper)
  implicit val historyJobFormat = jsonFormat3(HistoryJob)
  implicit val historyJobWrapperFormat = jsonFormat1(HistoryJobWrapper)
  implicit val taskAttemptFormat = jsonFormat9(TaskAttempt)
  implicit val taskAttemptsFormat = jsonFormat1(TaskAttempts)
  implicit val taskAttemptsWrapperFormat = jsonFormat1(TaskAttemptsWrapper)

}
