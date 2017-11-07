package com.directv.hw.hadoop.oozie.job

import akka.actor.ActorRef
import com.directv.hw.hadoop.oozie.client.OozieClient
import com.directv.hw.hadoop.oozie.model.{JobStatus, WorkflowJob}
import scaldi.Injector

object WorkflowJobActor extends OozieJobActorCompanion[WorkflowJob]

case class WorkflowJobActorHolder(actor: ActorRef)

class WorkflowJobActor(implicit injector: Injector) extends OozieJobActor[WorkflowJob](WorkflowJobActor) {

  override protected def requestJobs(client: OozieClient)(name: String,
                                                          statuses: List[JobStatus.Value],
                                                          length: Option[Int]): List[WorkflowJob] = {

    client.getWorkflowJobs(name = Some(name), statuses = statuses, len = length)
  }

  override protected def requestJob(client: OozieClient)(id: String): WorkflowJob = {
    client.getWorkflowJob(id)
  }
}
