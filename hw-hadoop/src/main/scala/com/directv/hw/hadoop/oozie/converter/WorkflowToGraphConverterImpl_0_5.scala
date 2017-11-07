package com.directv.hw.hadoop.oozie.converter

import com.directv.hw.core.exception.DapException
import com.directv.hw.hadoop.oozie.bindings.workflow_0_5.GlobalSerializer
import com.directv.hw.hadoop.oozie.bindings.workflow_0_5.binding._
import com.directv.hw.hadoop.oozie.model.{Connection, Node}
import com.directv.hw.hadoop.oozie.service.WorkflowConverter
import com.google.gson._
import com.typesafe.scalalogging.LazyLogging

import scala.collection.JavaConversions._


class WorkflowToGraphConverterImpl_0_5 extends WorkflowToGraphConverterBase with LazyLogging {

  // workflow version this converter supports
  override def getSupportedWorkflowVersion: String = "0.5"

  import WorkflowConverter.Oozie

  def getJsonSchemaAsString: String = com.directv.hw.hadoop.oozie.bindings.workflow_0_5.pluginDescription.getJsonSchemaAsString

  /**
   * getJson
   * String JSON representation of workflow config node.
   * Elements with 'JsonExclude' annotation are skipped.
   * Elements corresponding to the type adapters below are wrapped.
   */
  override lazy val pluginSerializers: List[(Class[_], Class[_])] =
    com.directv.hw.hadoop.oozie.bindings.shell_action_0_3.pluginDescription.additionalSerializers ++
      com.directv.hw.hadoop.oozie.bindings.shell_action_0_2.pluginDescription.additionalSerializers ++
      com.directv.hw.hadoop.oozie.bindings.shell_action_0_1.pluginDescription.additionalSerializers ++
      com.directv.hw.hadoop.oozie.bindings.spark_action_0_1.pluginDescription.additionalSerializers ++
      com.directv.hw.hadoop.oozie.bindings.spark_action_0_2.pluginDescription.additionalSerializers ++
      com.directv.hw.hadoop.oozie.bindings.workflow_0_5.pluginDescription.additionalSerializers ++
      com.directv.hw.hadoop.oozie.bindings.ssh_action_0_2.pluginDescription.additionalSerializers ++
      com.directv.hw.hadoop.oozie.bindings.ssh_action_0_1.pluginDescription.additionalSerializers ++
      com.directv.hw.hadoop.oozie.bindings.sqoop_action_0_4.pluginDescription.additionalSerializers ++
      com.directv.hw.hadoop.oozie.bindings.sqoop_action_0_3.pluginDescription.additionalSerializers ++
      com.directv.hw.hadoop.oozie.bindings.sqoop_action_0_2.pluginDescription.additionalSerializers ++
      com.directv.hw.hadoop.oozie.bindings.distcp_action_0_2.pluginDescription.additionalSerializers ++
      com.directv.hw.hadoop.oozie.bindings.distcp_action_0_1.pluginDescription.additionalSerializers ++
      com.directv.hw.hadoop.oozie.bindings.email_action_0_2.pluginDescription.additionalSerializers ++
      com.directv.hw.hadoop.oozie.bindings.email_action_0_1.pluginDescription.additionalSerializers ++
      com.directv.hw.hadoop.oozie.bindings.hive_action_0_5.pluginDescription.additionalSerializers ++
      com.directv.hw.hadoop.oozie.bindings.hive_action_0_4.pluginDescription.additionalSerializers ++
      com.directv.hw.hadoop.oozie.bindings.hive_action_0_3.pluginDescription.additionalSerializers ++
      com.directv.hw.hadoop.oozie.bindings.hive_action_0_2.pluginDescription.additionalSerializers

  def extractAction(action: ACTION): (Any, String, String) = {
    Option(action.getMapReduce) map { mapReduce =>
      // TODO (vkolischuk) code is duplicated in MapReduceSerializer
      val isMapReduce2 = Option(mapReduce.configuration) map { configuration =>
        configuration.getProperty filter { property =>
          Oozie.mapreduce.versionSelectKeys.contains(property.getName) && Oozie.mapreduce.versionSelectValue == property.getValue
        } groupBy(_.getName)
      } exists (_.size > 1)
      val mrType = if (isMapReduce2) {
        action.setMapReduce2(action.getMapReduce)
        action.setMapReduce(null)
        "map-reduce2"
      } else {
        "map-reduce"
      }
      (mapReduce, mrType, getSupportedWorkflowVersion)
    } orElse {
      List(
        (action.getPig, "pig", getSupportedWorkflowVersion),
        (action.getSubWorkflow, Oozie.nodeTypes.subWorkflow, getSupportedWorkflowVersion),
        (action.getFs, "fs", getSupportedWorkflowVersion),
        (action.getJava, "java", getSupportedWorkflowVersion),
        (action.getSqoop_0_4, "sqoop", "0.4"),
        (action.getSqoop_0_3, "sqoop", "0.3"),
        (action.getSqoop_0_2, "sqoop", "0.2"),
        (action.getSsh_0_2, "ssh", "0.2"),
        (action.getSsh_0_1, "ssh", "0.1"),
        (action.getShell_0_3, "shell", "0.3"),
        (action.getShell_0_2, "shell", "0.2"),
        (action.getShell_0_1, "shell", "0.1"),
        (action.getSpark_0_1, "spark", "0.1"),
        (action.getHive_0_5, "hive", "0.5"),
        (action.getHive_0_4, "hive", "0.4"),
        (action.getHive_0_3, "hive", "0.3"),
        (action.getHive_0_2, "hive", "0.2"),
        (action.getEmail_0_2, "email", "0.2"),
        (action.getEmail_0_1, "email", "0.1"),
        (action.getDistcp_0_2, "distcp", "0.2"),
        (action.getDistcp_0_1, "distcp", "0.1")
      ) find { triple =>
        triple._1 != null
      }
    } getOrElse {
      logger.error(s"Cannot extract action from [$action] [${action.getName}]")
      throw new DapException(s"Workflow parsing error: empty action")
    }
  }

  private val globalGson = {
    val gsonBuilder = new GsonBuilder
    gsonBuilder.registerTypeAdapter(classOf[GLOBAL], new GlobalSerializer)
    gsonBuilder.create
  }

  override protected def parse(xml: String): ParsedWorkflow = {
    val javaWfApp = parseWorkflowString(xml, classOf[WORKFLOWAPP])
    val nodes = Option(javaWfApp.getStart).toList ++ javaWfApp.getDecisionOrForkOrJoin.toList ++ Option(javaWfApp.getEnd)
    val propertiesForStartNode: String = getStartPropertiesJson(javaWfApp.getParameters, javaWfApp.getCredentials, javaWfApp.getGlobal)
    ParsedWorkflow(javaWfApp.getName, nodes, Some(propertiesForStartNode))
  }

  /**
   * Creates a Connection[s] (graph model)
   */
  override protected def extractConnections(record: AnyRef): Option[List[Connection]] = {
    record match {
      case start: START =>
        if (start.getTo != null)
          Some(List(Connection(WorkflowConverter.startNodeId, start.getTo, Oozie.connectors.out, "")))
        else None
      case end: END =>
        None
      case decision: DECISION =>
        val cases = decision.getSwitch.getCase
        Some(
          // cases
          cases.collect {
            case dCase: CASE if dCase.getTo != null =>
              Connection(decision.getName, dCase.getTo, Oozie.connectors.`case`, new GsonBuilder().create().toJson(CaseProps(dCase.getValue)))
          }.toList :+
          // default
          Connection(decision.getName, decision.getSwitch.getDefault.getTo, Oozie.connectors.default, "")
        )
      case fork: FORK =>
        val outs = fork.getPath
        Some(
          outs.collect {
            case out: FORKTRANSITION if out.getStart != null =>
              Connection(fork.getName, out.getStart, Oozie.connectors.out)
          }.toList
        )
      case join: JOIN =>
        if (join.getTo != null)
          Some(List(Connection(join.getName, join.getTo, Oozie.connectors.out, "")))
        else None
      case kill: KILL =>
        None
      case action: ACTION =>
        Some(List((action.getOk, Oozie.connectors.ok), (action.getError, Oozie.connectors.error)).collect {
          case (trans: ACTIONTRANSITION, connectorType: String) if trans.getTo != null =>
            Connection(action.getName, trans.getTo, connectorType)
        })
      case _ =>
        throw new IllegalArgumentException(s"Connection extraction for [$record] not implemented.")

    }

  }

  /**
   * Creates a Node (graph model)
   */
  override protected def extractNode(record: AnyRef, propertiesForStartNode: Option[String]): Node = {
    logger.debug(s"${record.toString }")
    record match {
      case start: START =>
        logger.debug("extracting start")
        Node(WorkflowConverter.startNodeId, Oozie.types.workflowControl, Oozie.subtypes.start, getSupportedWorkflowVersion, propertiesForStartNode.getOrElse(""))
      case end: END =>
        logger.debug("extracting end")
        Node(end.getName, Oozie.types.workflowControl, "end", getSupportedWorkflowVersion, "")
      case decision: DECISION =>
        logger.debug("extracting decision")
        Node(decision.getName, Oozie.types.workflowControl, "decision", getSupportedWorkflowVersion, getJson(decision))
      case fork: FORK =>
        logger.debug("extracting fork")
        Node(fork.getName, Oozie.types.workflowControl, "fork", getSupportedWorkflowVersion, getJson(fork))
      case join: JOIN =>
        logger.debug("extracting join")
        Node(join.getName, Oozie.types.workflowControl, "join", getSupportedWorkflowVersion, getJson(join))
      case kill: KILL =>
        logger.debug("extracting kill")
        Node(kill.getName, Oozie.types.workflowControl, "kill", getSupportedWorkflowVersion, getJson(kill))
      case action: ACTION =>
        logger.debug(s"extracting action: ${action.getName }")
        val (actionTypedObject, subType, subtypeVersion) = extractAction(action)
        Node(action.getName, Oozie.types.action, subType, subtypeVersion, getJson(action))
      case _ =>
        throw new IllegalArgumentException("Node extraction not supported.")

    }
  }

  /**
   * Global workflow 'parameters', 'credentials', 'global' types wrapper
   */
  def getStartPropertiesJson(parameters: PARAMETERS,
                             credentials: CREDENTIALS,
                             global: GLOBAL): String = {
    val gson = new GsonBuilder().create()
    val result = new JsonObject

    Option(parameters) flatMap(p => Option(p.getProperty)) withFilter(_.nonEmpty) foreach { pl =>
      val gson = new GsonBuilder().create()
      val tree = gson.toJsonTree(pl, classOf[java.util.List[PARAMETERS.Property]])
      result.add("property", tree)
    }
    result.add("global", globalGson.toJsonTree(global, classOf[GLOBAL]))
    Option(credentials) flatMap(c => Option(credentials.getCredential)) withFilter(_.nonEmpty) foreach { cl =>
      val gson = new GsonBuilder().create()
      val tree = gson.toJsonTree(cl, classOf[java.util.List[CREDENTIAL]])
      result.add("credential", tree)
    }
    result.toString
  }

  override protected def getNodeBindings: List[Class[_]] = {
    List(
      classOf[com.directv.hw.hadoop.oozie.bindings.workflow_0_5.binding.ACTION],
      classOf[com.directv.hw.hadoop.oozie.bindings.hive_action_0_2.binding.ACTION]
    )
  }
}
