package com.directv.hw.hadoop.oozie.job

import akka.actor.ActorRef
import com.directv.hw.hadoop.oozie.client.OozieClient
import com.directv.hw.hadoop.oozie.model.{CoordinatorJob, JobStatus, WorkflowJob}
import scaldi.Injector

object CoordinatorJobActor extends OozieJobActorCompanion[CoordinatorJob]

case class CoordinatorJobActorHolder(actor: ActorRef)

class CoordinatorJobActor(implicit injector: Injector) extends OozieJobActor[CoordinatorJob](CoordinatorJobActor) {

  override protected def requestJobs(client: OozieClient)(name: String,
                                                          statuses: List[JobStatus.Value],
                                                          length: Option[Int]): List[CoordinatorJob] = {

    client.getCoordinatorJobs(name = Some(name), statuses = statuses, len = length)
  }

  override protected def requestJob(client: OozieClient)(id: String): CoordinatorJob = {
    client.getCoordinatorJob(id)
  }
}
