package com.directv.hw.hadoop.flume.converter

import java.io.StringReader
import java.util.Properties

import com.directv.hw.core.exception.DapException
import com.directv.hw.hadoop.flume.model._

import scala.collection.JavaConverters._
import scala.collection.immutable.Iterable
import scala.language.postfixOps

object FlumeConverterCommon {
  val flumeModuleType = "flume"
  val agentNameIndex = 0
  val nodeTypeIndex = 1
  val nodeNameIndex = 2
  val nodePropIndex = 3
  val nodeKeysLength = 4
  val elementListKeysLength = 2
  val channelsProp = "channels"
  val channelProp = "channel"
  val typeProp = "type"

  val sourceNodeTypeKey = "sources"
  val sinkNodeTypeKey = "sinks"
  val channelNodeTypeKey = "channels"
}

class FlumeConverterImpl extends FlumeConverter {
  import FlumeConverterCommon._

  case class ConfigEntry(agentName: String, typeKey: String, name: String, key: String, value: String)
  case class FullFlumeNode(node: FlumeNode, connections: List[FlumeConnection])

  override def toFlumePipeline(textConfig: String): FlumePipeline = {
    val config = new Properties()
    config.load(new StringReader(textConfig.replace("\\", "\\\\"))) // workaround to save escape symbols
    val configKeys = config.propertyNames.asScala.toList.map(_.toString)

    val entries = configKeys map(key => key.split("[.]", nodeKeysLength) -> config.getProperty(key)) collect {
      case (parts, value) if parts.length == nodeKeysLength =>
        ConfigEntry(
          agentName = parts(agentNameIndex),
          typeKey = parts(nodeTypeIndex),
          name = parts(nodeNameIndex),
          key = parts(nodePropIndex),
          value = value
        )
    }

    val agents = entries groupBy (_.agentName) map { case (agentName, agentEntries) =>
      val parsedNodes = agentEntries groupBy (_.typeKey) flatMap { case (typeKey, typeEntries) =>
        typeEntries groupBy (_.name) map { case (name, nodeEntries) =>
          parseNodeKeys(nodeEntries, typeKey, name)
        }
      }
      createAgent(agentName, parsedNodes)
    }

    val agentNames = agents map (_.agentName) toSet
    val missingEmptyAgents = configKeys map(key => key.split("[.]", elementListKeysLength) -> config.getProperty(key)) collect {
      case (parts, value) if parts.length == elementListKeysLength &&
        (parts(nodeTypeIndex) == sourceNodeTypeKey || parts(nodeTypeIndex) == sourceNodeTypeKey || parts(nodeTypeIndex) == sourceNodeTypeKey ) =>
        parts(agentNameIndex)
    } filterNot agentNames.contains map (createAgent(_, List.empty))


    agents foreach validatePipeline

    (agents ++ missingEmptyAgents).headOption getOrElse createAgent("", List.empty)
  }

  private def parseNodeKeys(entries: List[ConfigEntry], typeKey: String, name: String): FullFlumeNode = {
    val allProperties = entries map (e => e.key -> e.value) toMap

    val subtype = allProperties(typeProp)
    val uiProperties = allProperties - typeProp - channelsProp - channelProp

    val channelsValue: Option[String] = allProperties get channelsProp orElse (allProperties get channelProp)
    val channels: List[String] = channelsValue map (_.split("\\s+") map (_.trim) toList) getOrElse List.empty

    typeKey match {
      case `sourceNodeTypeKey` =>
        val node = new FlumeSource(name, subtype, uiProperties)
        val connections = channels map (FlumeConnection(name, _))
        FullFlumeNode(node, connections)
      case `sinkNodeTypeKey` =>
        val node = new FlumeSink(name, subtype, uiProperties)
        val connections = channels map (FlumeConnection(_, name))
        FullFlumeNode(node, connections)
      case `channelNodeTypeKey` =>
        val node = new FlumeChannel(name, subtype, uiProperties)
        FullFlumeNode(node, List.empty)
      case t => throw new scala.IllegalArgumentException(s"unknown node type - $t")
    }
  }

  private def createAgent(agentName: String, parsedNodes: Iterable[FullFlumeNode]): FlumePipeline = {
    val emptyPipeline = FlumePipeline(agentName, List.empty, List.empty, List.empty, List.empty)
    parsedNodes.foldLeft(emptyPipeline) { (agent, fullNode) =>
      fullNode.node match {
        case source: FlumeSource =>
          agent.copy(sources = agent.sources :+ source, connections = agent.connections ++ fullNode.connections)
        case channel: FlumeChannel =>
          agent.copy(channels = agent.channels :+ channel, connections = agent.connections ++ fullNode.connections)
        case sink: FlumeSink =>
          agent.copy(sinks = agent.sinks :+ sink, connections = agent.connections ++ fullNode.connections)
      }
    }
  }

  //noinspection ScalaDeprecation
  @Deprecated
  def getNodeKeys(configKeys: List[String]) = {
    configKeys.filter(key => splitKey(key).length >= nodeKeysLength)
  }

  //noinspection ScalaDeprecation
  @Deprecated
  def toFlumeNodes(nodesKeys: List[String], config: Properties): List[FlumeNode] = {
    for (name: String <- getDistinctNodeNames(nodesKeys)) yield {
      val nodeKeys = nodesKeys.filter(key => splitKey(key)(nodeNameIndex) == name)

      val allProperties = nodeKeys map { key =>
        extractNodeProp(key) -> config.getProperty(key)
      } toMap
      val subtype = allProperties(typeProp)
      val uiProperties = allProperties - typeProp - channelsProp - channelProp

      val nodeType: String = splitKey(nodeKeys.head)(nodeTypeIndex)
      nodeType match {
        case `sourceNodeTypeKey` => new FlumeSource(name, subtype, uiProperties)
        case `sinkNodeTypeKey` => new FlumeSink(name, subtype, uiProperties)
        case `channelNodeTypeKey` => new FlumeChannel(name, subtype, uiProperties)
        case t => throw new IllegalArgumentException(s"unknown node type - $t")
      }
    }
  }

  //noinspection ScalaDeprecation
  @Deprecated
  def extractNodeProp(key: String): String = {
    val propParts = splitKey(key).toList.drop(nodePropIndex)
    propParts.mkString(".")
  }

  //noinspection ScalaDeprecation
  @Deprecated
  def getDistinctNodeNames(keys: List[String]) = {
    keys.map(key => splitKey(key)(nodeNameIndex)).distinct
  }

  @Deprecated
  def splitKey(key: String) = {
    key.split("[.]", nodeKeysLength)
  }

  def validatePipeline(pipe: FlumePipeline) = {
    pipe.connections.foreach(connection =>
      if ((!pipe.sources.exists(_.name == connection.from) || !pipe.channels.exists(_.name == connection.to)) &&
        (!pipe.channels.exists(_.name == connection.from) || !pipe.sinks.exists(_.name == connection.to))) {
        throw new DapException(s"Error in agent configuration: bad connection from [${connection.from}] to [${connection.to}]")
      }
    )
  }

  //noinspection ScalaDeprecation
  @Deprecated
  override def toFlumeNode(config: String): FlumeNode = {
    val props = new Properties()
    props.load(new StringReader(config))
    val configKeys = props.propertyNames.asScala.toList.map(_.toString)

    val nodeKeys = getNodeKeys(configKeys)
    val flumeNodes = toFlumeNodes(nodeKeys, props)

    flumeNodes.head
  }


  override def toTextConfig(pipeline: FlumePipeline): String = {
    validatePipeline(pipeline)

    val agentName = pipeline.agentName

    val sourceNamesConfig = toTextConfig(pipeline.sources, agentName, sourceNodeTypeKey)

    val sinkNamesConfig = toTextConfig(pipeline.sinks, agentName, sinkNodeTypeKey)

    val channelNamesConfig = toTextConfig(pipeline.channels, agentName, channelNodeTypeKey)

    val flumeNodes = pipeline.sources ++ pipeline.sinks ++ pipeline.channels
    val nodesConfig = flumeNodes map(toTextConfig(_, agentName, pipeline.connections)) mkString "\n"

    val header = List(sourceNamesConfig, sinkNamesConfig, channelNamesConfig) mkString "\n"
    val config = List(header, nodesConfig) mkString "\n\n"

    config
  }

  def toTextConfig(nodes: List[FlumeNode], agentName: String, key: String) = {
    val names = nodes map(_.name) mkString " "
    agentName + "." + key + " = " + names
  }

  def toTextConfig(flumeNode: FlumeNode, agentName: String, connections: List[FlumeConnection]) = {
    val nodeTypeKey = flumeNode match {
      case node: FlumeSource => sourceNodeTypeKey
      case node: FlumeSink => sinkNodeTypeKey
      case node: FlumeChannel => channelNodeTypeKey
    }

    val allProperties: Map[String, String] =
      flumeNode.properties.filter(t => t._2 != null && t._2.nonEmpty)+ (typeProp -> flumeNode.nodeType)
    val nodeConfig = allProperties.map { property =>
      agentName + "." + nodeTypeKey + "." + flumeNode.name + "." + property._1 + " = " + property._2
    }.mkString("\n")

    val channelsConfigOption = flumeNode match {
      case node: FlumeSource =>
        val channels = connections.filter(_.from == node.name).map(_.to).mkString(" ")
        if (channels.nonEmpty)
          Some(agentName + "." + nodeTypeKey + "." + node.name + "." + channelsProp + " = " + channels)
        else None

      case node: FlumeSink =>
        val channelOption = connections.find(_.to == node.name).map(_.from)
        channelOption.map(channel => agentName + "." + nodeTypeKey + "." + node.name + "." + channelProp + " = " + channel)

      case _ => None
    }

    List(Some(nodeConfig), channelsConfigOption).flatten[String].mkString("\n")
  }

  override def toNodeConfig(node: FlumeNode, agentName: String): NodeConfig = {
    val textConfig = toTextConfig(node, agentName, List.empty)
    NodeConfig(node.name, agentName, textConfig)
  }
}