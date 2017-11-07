package com.directv.hw.oozie.service.plugin.model

case class WorkflowJob(id: String,
                       appName: String,
                       appPath: String,
                       user: String,
                       status: String,
                       createdTime: String,
                       startTime: String,
                       endTime: String,
                       run: Int,
                       actions: java.util.List[Action],
                       parentId: String,
                       externalId: String)

case class CoordinatorJob(coordJobId: String,
                          coordJobName: String,
                          coordJobPath: String,
                          coordExternalId: String,
                          user: String,
                          startTime: String,
                          endTime: String,
                          timeUnit: String,
                          nextMaterializedTime: String,
                          status: String,
                          frequency: String,
                          lastAction: String,
                          timeOut: Int)
