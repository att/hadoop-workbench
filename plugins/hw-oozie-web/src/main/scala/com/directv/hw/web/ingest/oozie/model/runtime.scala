package com.directv.hw.web.ingest.oozie.model

import com.directv.hw.hadoop.oozie.model.{CoordinatorJob, WorkflowJob}

case class OozieJobs(jobs: List[WorkflowJob], coordinatorJobs: List[CoordinatorJob])
case class OozieLog(log: String)