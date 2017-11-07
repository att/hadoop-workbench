package com.directv.hw.hadoop.yarn


case class ApplicationRespWrapper(app: ApplicationResp)
case class ApplicationResp(id: String, applicationType: String, user: String, state: String, amContainerLogs: String)
case class AppAttemptsWrapper(appAttempts: AppAttempts)
case class AppAttempts(appAttempt: List[AppAttempt])
case class AppAttempt(id: Int,
                      startTime: Long,
                      finishedTime: Long,
                      logsLink: String,
                      appAttemptId: String)

case class HistoryJobWrapper(job: HistoryJob)
case class HistoryJob(id: String, user: String, state: String)
case class JobTasksWrapper(tasks: JobTasks)
case class JobTasks(task: List[JobTask])
case class JobTask(startTime: Long,
                   finishTime: Long,
                   elapsedTime: Long,
                   progress: Int,
                   id: String,
                   state: String,
                  `type`: String,
                   successfulAttempt: String)

case class TaskAttemptsWrapper(taskAttempts: TaskAttempts)
case class TaskAttempts(taskAttempt: List[TaskAttempt])
case class TaskAttempt(startTime: Long,
                       finishTime: Long,
                       elapsedTime: Long,
                       progress: Int,
                       id: String,
                       state: String,
                       `type`: String,
                       nodeHttpAddress: String,
                       assignedContainerId: String)

