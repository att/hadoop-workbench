package com.directv.hw.hadoop.di

import akka.actor.{ActorRef, ActorSystem, Props}
import com.directv.hw.hadoop.config.{ConfigConverter, ConfigConverterImpl, OozieConfigurationProcessor}
import com.directv.hw.hadoop.oozie.client.{OozieClientRouter, OozieClientRouterImpl}
import com.directv.hw.hadoop.oozie.config.OozieTemplateProcessor
import com.directv.hw.hadoop.oozie.converter._
import com.directv.hw.hadoop.oozie.indexation.OozieIndexer
import com.directv.hw.hadoop.oozie.job._
import com.directv.hw.hadoop.oozie.parser.{CoordinatorParserImpl, WorkflowParserImpl}
import com.directv.hw.hadoop.oozie.service._
import scaldi.Module

object OozieModule extends Module {

  bind [GraphToWorkflowConverterImpl_0_5] to new GraphToWorkflowConverterImpl_0_5
  bind [GraphToWorkflowConverterImpl_0_4_5] to new GraphToWorkflowConverterImpl_0_4_5
  bind [GraphToWorkflowConverterImpl_0_4] to new GraphToWorkflowConverterImpl_0_4
  bind [GraphToWorkflowConverterImpl_0_3] to new GraphToWorkflowConverterImpl_0_3
  bind [GraphToWorkflowConverterImpl_0_2_5] to new GraphToWorkflowConverterImpl_0_2_5
  bind [GraphToWorkflowConverterImpl_0_2] to new GraphToWorkflowConverterImpl_0_2
  bind [GraphToWorkflowConverterImpl_0_1] to new GraphToWorkflowConverterImpl_0_1
  bind [WorkflowToGraphConverterImpl_0_5] to new WorkflowToGraphConverterImpl_0_5
  bind [WorkflowToGraphConverterImpl_0_4_5] to new WorkflowToGraphConverterImpl_0_4_5
  bind [WorkflowToGraphConverterImpl_0_4] to new WorkflowToGraphConverterImpl_0_4
  bind [WorkflowToGraphConverterImpl_0_3] to new WorkflowToGraphConverterImpl_0_3
  bind [WorkflowToGraphConverterImpl_0_2_5] to new WorkflowToGraphConverterImpl_0_2_5
  bind [WorkflowToGraphConverterImpl_0_2] to new WorkflowToGraphConverterImpl_0_2
  bind [WorkflowToGraphConverterImpl_0_1] to new WorkflowToGraphConverterImpl_0_1

  lazy val marshallers = List (
    new GraphToWorkflowConverterImpl_0_5,
    new GraphToWorkflowConverterImpl_0_4_5,
    new GraphToWorkflowConverterImpl_0_4,
    new GraphToWorkflowConverterImpl_0_3,
    new GraphToWorkflowConverterImpl_0_2_5,
    new GraphToWorkflowConverterImpl_0_2,
    new GraphToWorkflowConverterImpl_0_1
  )

  lazy val unmarshallers = List (
    new WorkflowToGraphConverterImpl_0_5,
    new WorkflowToGraphConverterImpl_0_4_5,
    new WorkflowToGraphConverterImpl_0_4,
    new WorkflowToGraphConverterImpl_0_3,
    new WorkflowToGraphConverterImpl_0_2_5,
    new WorkflowToGraphConverterImpl_0_2,
    new WorkflowToGraphConverterImpl_0_1
  )

  bind [OozieFilesConverter] to new OozieFilesConverterImpl(marshallers, unmarshallers)
  bind [ConfigConverter] to new ConfigConverterImpl
  bind [WorkflowWebConverter] to new WorkflowWebConverterImpl
  bind [OozieDeploymentPersistenceService] to new OozieDeploymentPersistenceServiceImpl
  bind [OozieComponentPersistenceService] to new OozieComponentPersistenceServiceImpl
  bind [OozieComponentContentServiceFactory] to new OozieComponentContentServiceFactoryImpl
  bind [OozieDeploymentContentServiceFactory] to new OozieDeploymentContentServiceFactoryImpl

  lazy val dirsToRender = Set ("properties")
  lazy val filesToRender = Set ("config-default.xml", "workflow.xml")

  lazy val oozieService = new OozieDeploymentServiceImpl
  bind [OozieDeploymentService] to oozieService
  bind [WorkflowParser] to new WorkflowParserImpl
  bind [CoordinatorParser] to new CoordinatorParserImpl
  bind [OozieClientRouter] to new OozieClientRouterImpl("oozie-service")
  bind [OozieRuntimeService] to new OozieRuntimeServiceImpl
  bind [OozieLogService] to new OozieLogServiceImpl
  bind [OozieService] to new OozieServiceImpl

  lazy val system: ActorSystem = inject[ActorSystem]
  bind [ActorRef] as HadoopDiReferences.oozieIndexer to system.actorOf(Props(new OozieIndexer(oozieService)))
  bind [ExternalLogAggregatorRouter] to new ExternalLogAggregatorRouter
  bind [OozieMetaDataService] to new OozieMetaDataServiceImpl
  bind [OozieConfigurationProcessor] to new OozieTemplateProcessor
  bind [WorkflowJobActorHolder] to WorkflowJobActorHolder(system.actorOf(Props(new WorkflowJobActor)))
  bind [CoordinatorJobActorHolder] to CoordinatorJobActorHolder(system.actorOf(Props(new CoordinatorJobActor), "coordinatorJobs"))
}