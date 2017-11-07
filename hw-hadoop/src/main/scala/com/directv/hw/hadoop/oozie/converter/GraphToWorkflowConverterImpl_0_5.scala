package com.directv.hw.hadoop.oozie.converter

import com.directv.hw.core.exception.DapException
import com.directv.hw.hadoop.oozie.bindings.workflow_0_5.GlobalDeserializer
import com.directv.hw.hadoop.oozie.bindings.workflow_0_5.binding._
import com.directv.hw.hadoop.oozie.model.WorkflowGraph
import com.directv.hw.hadoop.oozie.service.{ConversionOptions, WorkflowConverter}
import com.google.gson.GsonBuilder
import com.typesafe.scalalogging.LazyLogging


class GraphToWorkflowConverterImpl_0_5 extends GraphToWorkflowConverterBase with LazyLogging {

  // workflow version this converter supports
  override def getSupportedWorkflowVersion: String = "0.5"
  override protected type supportedType = WORKFLOWAPP
  override protected def supportedClass = classOf[WORKFLOWAPP]

  import WorkflowConverter._
  override lazy val pluginDeserializers: List[(Class[_], Class[_])] =
    com.directv.hw.hadoop.oozie.bindings.shell_action_0_3.pluginDescription.additionalDeserializers ++
      com.directv.hw.hadoop.oozie.bindings.shell_action_0_2.pluginDescription.additionalDeserializers ++
      com.directv.hw.hadoop.oozie.bindings.shell_action_0_1.pluginDescription.additionalDeserializers ++
      com.directv.hw.hadoop.oozie.bindings.spark_action_0_1.pluginDescription.additionalDeserializers ++
      com.directv.hw.hadoop.oozie.bindings.spark_action_0_2.pluginDescription.additionalDeserializers ++
      com.directv.hw.hadoop.oozie.bindings.workflow_0_5.pluginDescription.additionalDeserializers ++
      com.directv.hw.hadoop.oozie.bindings.ssh_action_0_2.pluginDescription.additionalDeserializers ++
      com.directv.hw.hadoop.oozie.bindings.ssh_action_0_1.pluginDescription.additionalDeserializers ++
      com.directv.hw.hadoop.oozie.bindings.sqoop_action_0_4.pluginDescription.additionalDeserializers ++
      com.directv.hw.hadoop.oozie.bindings.sqoop_action_0_3.pluginDescription.additionalDeserializers ++
      com.directv.hw.hadoop.oozie.bindings.sqoop_action_0_2.pluginDescription.additionalDeserializers ++
      com.directv.hw.hadoop.oozie.bindings.distcp_action_0_2.pluginDescription.additionalDeserializers ++
      com.directv.hw.hadoop.oozie.bindings.distcp_action_0_1.pluginDescription.additionalDeserializers ++
      com.directv.hw.hadoop.oozie.bindings.email_action_0_2.pluginDescription.additionalDeserializers ++
      com.directv.hw.hadoop.oozie.bindings.email_action_0_1.pluginDescription.additionalDeserializers ++
      com.directv.hw.hadoop.oozie.bindings.hive_action_0_5.pluginDescription.additionalDeserializers ++
      com.directv.hw.hadoop.oozie.bindings.hive_action_0_4.pluginDescription.additionalDeserializers ++
      com.directv.hw.hadoop.oozie.bindings.hive_action_0_3.pluginDescription.additionalDeserializers ++
      com.directv.hw.hadoop.oozie.bindings.hive_action_0_2.pluginDescription.additionalDeserializers


  case class startProps (property: java.util.List[PARAMETERS.Property],
                         global: GLOBAL,
                         credential: java.util.List[CREDENTIAL])
  private val globalGson = {
    val gsonBuilder = new GsonBuilder
    gsonBuilder.registerTypeAdapter(classOf[GLOBAL], new GlobalDeserializer)
    gsonBuilder.create
  }

  override def toWorkflow(graph: WorkflowGraph, options: ConversionOptions): supportedType = {
    val wfApp: supportedType = new supportedType

    val connections = graph.connections

    wfApp.setName(graph.name)

    graph.nodes foreach { node =>
      val json = node.properties
      (node.`type`, node.subtype, node.version) match {
        case (Oozie.types.workflowControl, Oozie.subtypes.start, getSupportedWorkflowVersion) =>
          val startProperties = globalGson.fromJson(json, classOf[startProps])
          if (startProperties != null) {
            Option(startProperties.property) withFilter(!_.isEmpty) foreach { properties =>
              val parameters = new PARAMETERS
              parameters.getProperty addAll properties
              wfApp.setParameters(parameters)
            }
            if (wfApp.getParameters != null) if (wfApp.getParameters.getProperty.isEmpty) wfApp.setParameters(null)
            if (startProperties.global != null && startProperties.global.getConfiguration != null && startProperties.global.getConfiguration.getProperty.isEmpty) {
              startProperties.global.setConfiguration(null)
            }

            wfApp.setGlobal(startProperties.global)
            if (wfApp.getGlobal != null && ((wfApp.getGlobal.getConfiguration == null) || (wfApp.getGlobal.getConfiguration != null && wfApp.getGlobal.getConfiguration.getProperty.isEmpty))
              && wfApp.getGlobal.getJobTracker.isEmpty
              && wfApp.getGlobal.getJobXml.isEmpty
              && wfApp.getGlobal.getNameNode.isEmpty)
              wfApp.setGlobal(null)

            Option(startProperties.credential) withFilter(!_.isEmpty) foreach { jsonCredentials =>
              val xmlCredentials = new CREDENTIALS
              xmlCredentials.getCredential.addAll(jsonCredentials)
              wfApp.setCredentials(xmlCredentials)
            }
          }

          wfApp.setStart(new START)
          wfApp.getStart.setTo(findTarget(connections, options, node))
        case (Oozie.types.workflowControl, Oozie.subtypes.end, getSupportedWorkflowVersion) =>
          wfApp.setEnd(new END)
          wfApp.getEnd.setName(node.id)
        case (Oozie.types.workflowControl, "decision", getSupportedWorkflowVersion) =>
          val decision = new DECISION
          decision.setName(node.id)
          decision.setSwitch(new SWITCH)
          connections withFilter(c => c.from == node.id && c.connector == Oozie.connectors.`case`) foreach { connectionForCase =>
            val `case` = new CASE
            `case`.setTo(connectionForCase.to)
            if (connectionForCase.properties != "")
              try {
                val caseProps: CaseProps = new GsonBuilder().create().fromJson(connectionForCase.properties, classOf[CaseProps])
                `case`.setValue(caseProps.`case`)
              } catch {
                case e: Throwable => throw new DapException(s"Error in 'case' connection for [${decision.getName }] decision node!", e)
              }
            decision.getSwitch.getCase.add(`case`)
          }
          val `default` = new DEFAULT
          `default`.setTo(findTarget(connections, options, node, Some(Oozie.connectors.default)))
          decision.getSwitch.setDefault(`default`)
          decision.setName(node.id)
          wfApp.getDecisionOrForkOrJoin.add(decision)
        case (Oozie.types.workflowControl, "fork", getSupportedWorkflowVersion) =>
          val `fork` = fromJson(json, classOf[FORK])
          `fork`.setName(node.id)
          connections withFilter(c => c.from == node.id) foreach { connection =>
            val transition = new FORKTRANSITION
            transition.setStart(connection.to)
            `fork`.getPath.add(transition)
          }
          wfApp.getDecisionOrForkOrJoin.add(`fork`)
        case (Oozie.types.workflowControl, "join", getSupportedWorkflowVersion) =>
          val `join` = fromJson(json, classOf[JOIN])
          `join`.setName(node.id)
          `join`.setTo(findTarget(connections, options, node))
          wfApp.getDecisionOrForkOrJoin.add(`join`)
        case (Oozie.types.workflowControl, "kill", getSupportedWorkflowVersion) =>
          val `kill` = fromJson(json, classOf[KILL])
          `kill`.setName(node.id)
          wfApp.getDecisionOrForkOrJoin.add(`kill`)
        case ("action", subtype: String, version: String) =>
          val action = fromJson(json, classOf[ACTION])
          if (action.getMapReduce2 != null) {
            action.setMapReduce(action.getMapReduce2)
            action.setMapReduce2(null)
          }
          action.setName(node.id)
          action.setOk(new ACTIONTRANSITION)
          action.getOk.setTo(findTarget(connections, options, node, Some(Oozie.connectors.ok)))
          action.setError(new ACTIONTRANSITION)
          action.getError.setTo(findTarget(connections, options, node, Some(Oozie.connectors.error)))
          wfApp.getDecisionOrForkOrJoin.add(action)
        case _ =>
          throw new IllegalAccessException(s"Json extraction of [${node.getClass.toString } (${node.`type`}, ${node.subtype})] properties is not supported.")
      }
    }

    wfApp
  }

}
