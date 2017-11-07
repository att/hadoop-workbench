package com.directv.hw.web.ingest.flume.converter

import com.directv.hw.hadoop.flume.model._
import com.directv.hw.web.ingest.flume.model._
import org.scalatest.{FlatSpec, Matchers}

class FlumeApiConverterSpec extends FlatSpec with Matchers {

  import com.directv.hw.web.ingest.flume.converter.FlumeWebConverter._

  val flumeApiConverter = new FlumeWebConverterImpl

  "flume role group" should "be converted to plugin model" in {
    val sourceProperties = Map("type" -> "avro", "hostname" -> "localhost", "port" -> "1111")
    val source1 = new FlumeSource("source1", "avro", sourceProperties)
    val source2 = new FlumeSource("source2", "avro", sourceProperties)
    val source3 = new FlumeSource("source3", "avro", sourceProperties)

    val sink1Properties = Map("type" -> "hdfs", "hostname" -> "192.168.1.1", "port" -> "8888")
    val sink1 = new FlumeSink("sink1", "hdfs", sink1Properties)

    val sink2Properties = Map("type" -> "avro", "hostname" -> "192.168.1.2", "port" -> "9999")
    val sink2 = new FlumeSink("sink2", "avro", sink2Properties)

    val sink3Properties = Map("type" -> "avro", "hostname" -> "192.168.1.2", "port" -> "9999")
    val sink3 = new FlumeSink("sink3", "avro", sink3Properties)

    val channel1Properties = Map("type" -> "memory", "size" -> "1024")
    val channel1 = new FlumeChannel("channel1", "memory", channel1Properties)

    val channel2Properties = Map("type" -> "memory", "size" -> "1024")
    val channel2 = new FlumeChannel("channel2", "memory", channel2Properties)

    val channel3Properties = Map("type" -> "memory", "size" -> "1024")
    val channel3 = new FlumeChannel("channel3", "memory", channel3Properties)

    val connection1 = new FlumeConnection("source1", "channel1")
    val connection2 = new FlumeConnection("source1", "channel2")
    val connection3 = new FlumeConnection("channel1", "sink1")
    val connection4 = new FlumeConnection("channel2", "sink2")
    val connection5 = new FlumeConnection("source2", "channel3")
    val connection6 = new FlumeConnection("channel3", "sink3")

    val flumeAgent = new FlumePipeline("group_name",
      List(source1, source2, source3),
      List(sink1, sink2, sink3),
      List(channel1, channel2, channel3),
      List(connection1, connection2, connection3, connection4, connection5, connection6))

    val model: FlumeGraph = flumeApiConverter.toGraph(flumeAgent, None)

    model.agentName should be (flumeAgent.agentName)

    model.nodes should have size 9

    val sourceNodes = model.nodes.filter(_.`type` == sourceType)
    sourceNodes should have size 3
    val source1Node = sourceNodes.find(_.id == "source1").get
    source1Node.id should be (source1.name)
    source1Node.subtype should be (source1.nodeType)
    source1Node.properties should have size 3
    source1Node.properties.get("type").get should be ("avro")
    source1Node.properties.get("hostname").get should be ("localhost")
    source1Node.properties.get("port").get should be ("1111")
    verifyPosition(source1Node, 0 ,0)

    val sinkNodes = model.nodes.filter(_.`type` == sinkType)
    sinkNodes should have size 3
    val sink1Node = sinkNodes.find(_.id == "sink1").get
    sink1Node.id should be (sink1.name)
    sink1Node.subtype should be (sink1.nodeType)
    sink1Node.properties should have size 3
    sink1Node.properties.get("type").get should be ("hdfs")
    sink1Node.properties.get("hostname").get should be ("192.168.1.1")
    sink1Node.properties.get("port").get should be ("8888")
    verifyPosition(sink1Node, 2, 0)
    val sink2Node = sinkNodes.find(_.id == "sink2").get
    verifyPosition(sink2Node, 2, 1)


    val channelNodes = model.nodes.filter(_.`type` == channelType)
    channelNodes should have size 3
    val channel1Node = channelNodes.find(_.id == "channel1").get
    channel1Node.id should be (channel1.name)
    channel1Node.subtype should be (channel1.nodeType)
    channel1Node.properties should have size 2
    channel1Node.properties.get("type").get should be ("memory")
    channel1Node.properties.get("size").get should be ("1024")
    verifyPosition(channel1Node, 1, 0)
    val channel2Node = channelNodes.find(_.id == "channel2").get
    verifyPosition(channel2Node, 1, 1)

    val source2Node = sourceNodes.find(_.id == "source2").get
    verifyPosition(source2Node, 0, 2)
    val channel3Node = channelNodes.find(_.id == "channel3").get
    verifyPosition(channel3Node, 1, 2)
    val sink3Node = sinkNodes.find(_.id == "sink3").get
    verifyPosition(sink3Node, 2, 2)

    val source3Node = sourceNodes.find(_.id == "source3").get
    verifyPosition(source3Node, 0, 3)

    model.connections should have size 6
    val modelConnection1 = model.connections.head
    modelConnection1.from should be ("source1")
    modelConnection1.to should be ("channel1")
  }

  def verifyPosition(node: Node, x: Int, y: Int) = {
    node.position.x should be (x)
    node.position.y should be (y)
  }

  "plugin model" should "be converted to flume model" in {

    val source1Properties = Map("type" -> "avro", "hostname" -> "localhost", "port" -> "1111")
    val source1Position = Position(1,1)
    val source1Node = Node("source1", sourceType, "avro", source1Properties, source1Position)

    val channel1Properties = Map("type" -> "memory", "size" -> "1024")
    val channel1Position = Position(2,1)
    val channel1Node = Node("channel1", channelType, "memory", channel1Properties, channel1Position)

    val sink1Properties = Map("type" -> "hdfs", "hostname" -> "192.168.1.1", "port" -> "8888")
    val sink1Position = Position(3,1)
    val sink1Node = Node("sink1", sinkType, "hdfs", sink1Properties, sink1Position)

    val modelConnection1 = Connection("source1", "channel1")

    val modelConnection2 = Connection("channel1", "sink1")

    val nodes = List(source1Node, sink1Node, channel1Node)
    val connections = List(modelConnection1, modelConnection2)
    val module = FlumeGraph("module_name", nodes, connections, None)

    val flumeAgent: FlumePipeline = flumeApiConverter.toFlumeAgent(module)
    flumeAgent.agentName should be (module.agentName)

    flumeAgent.sources should have size 1
    val source1 = flumeAgent.sources.find(_.name == source1Node.id).get
    source1.name should be (source1Node.id)
    source1.nodeType should be (source1Node.subtype)
    source1.properties should have size 3
    source1.properties should contain ("type" -> "avro")
    source1.properties should contain ("hostname" -> "localhost")
    source1.properties should contain ("port" -> "1111")

    flumeAgent.sinks should have size 1
    val sink1 = flumeAgent.sinks.find(_.name == sink1Node.id).get
    sink1.name should be (sink1Node.id)
    sink1.nodeType should be (sink1Node.subtype)
    sink1.properties should have size 3
    sink1.properties should contain ("type" -> "hdfs")
    sink1.properties should contain ("hostname" -> "192.168.1.1")
    sink1.properties should contain ("port" -> "8888")

    flumeAgent.channels should have size 1
    val channel1 = flumeAgent.channels.find(_.name == channel1Node.id).get
    channel1.name should be (channel1Node.id)
    channel1.nodeType should be (channel1Node.subtype)
    channel1.properties should have size 2
    channel1.properties should contain ("type" -> "memory")
    channel1.properties should contain ("size" -> "1024")

    flumeAgent.connections should have size 2
    val connection1 = flumeAgent.connections(0)
    connection1.from should be ("source1")
    connection1.to should be ("channel1")

    val connection2 = flumeAgent.connections(1)
    connection2.from should be ("channel1")
    connection2.to should be ("sink1")
  }
}
