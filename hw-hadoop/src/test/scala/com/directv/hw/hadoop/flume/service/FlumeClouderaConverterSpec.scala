package com.directv.hw.hadoop.flume.service

import com.directv.hw.common.io.DapIoUtils
import com.directv.hw.hadoop.flume.converter.FlumeConverterImpl
import com.directv.hw.hadoop.flume.model._
import org.scalatest.{FlatSpec, Matchers}

import scala.io.Source._

class FlumeClouderaConverterSpec extends FlatSpec with Matchers {

  val textConfig = DapIoUtils.managed2(getClass.getClassLoader.getResourceAsStream("test/cloudera/flume/test.properties")) {input =>
    fromInputStream(input).getLines().mkString("\n")
  }

  val converter = new FlumeConverterImpl

  "property key" should "be split into parts" in {
    val key = "tier1.sources.source1.type"
    val parts = converter.splitKey(key)
    parts.length should be(4)
    parts(3) should be("type")
  }

  "node property" should "be extracted" in {
    val key = "tier1.sources.source1.type"
    converter.extractNodeProp(key) should be("type")

    val longKey = "tier1.sources.source1.type.something"
    converter.extractNodeProp(longKey) should be("type.something")
  }

  it should "produce distinct node names" in {

    val keys = List(
      "tier1.sources.source1.type",
      "tier1.sources.source1.bind",
      "tier1.sources.source1.port",
      "tier1.sources.source1.channels",
      "tier1.channels.channel1.type",
      "tier1.sinks.sink1.type",
      "tier1.sinks.sink1.channel"
    )

    val names: List[String] = converter.getDistinctNodeNames(keys)
    names.length should be(3)
  }


  "test agent config" should "be converted to FlumeRoleGroup" in {
    val id = "flume-agent-1"
    val name = "name"
    val title = "title"
    val agent = converter.toFlumePipeline(textConfig)
    agent.agentName should be("vk_7")

    assertSinks(agent.sinks)
    assertChannels(agent.channels)
    assertConnections(agent.connections)
  }

  def assertSinks(sinks: List[FlumeSink]) {
    sinks.length should be(1)
    sinks.exists(node => node.name == "hdfs_snk") should be(right = true)
  }

  def assertChannels(channels: List[FlumeChannel]) {
    channels.length should be(2)
    channels.exists(node => node.name == "file_cnl") should be(right = true)
    channels.exists(node => node.name == "file_cnl2") should be(right = true)
  }

  def assertConnections(connections: List[FlumeConnection]) {
    connections.length should be(5)

    val sd_src_Connections = connections.filter(connection => connection.from == "sd_src")
    sd_src_Connections.length should be(2)
    sd_src_Connections(0).to should be("file_cnl")
    sd_src_Connections(1).to should be("file_cnl2")

    val file_cnl_Connections = connections.filter(connection => connection.from == "file_cnl")
    file_cnl_Connections.length should be(1)
    file_cnl_Connections(0).to should be("hdfs_snk")
  }

  "flume role group" should "be converted to cloudera config" in {
    val sourceProperties = Map("type" -> "avro", "hostname" -> "localhost", "port" -> "1111")
    val source = new FlumeSource("source1", "avro", sourceProperties)

    val sink1Properties = Map("type" -> "hdfs", "hostname" -> "192.168.1.1", "port" -> "8888")
    val sink1 = new FlumeSink("sink1", "hdfs", sink1Properties)

    val sink2Properties = Map("type" -> "avro", "hostname" -> "192.168.1.2", "port" -> "9999")
    val sink2 = new FlumeSink("sink2", "avro", sink2Properties)

    val channel1Properties = Map("type" -> "memory", "size" -> "1024")
    val channel1 = new FlumeChannel("channel1", "memory", channel1Properties)

    val channel2Properties = Map("type" -> "memory", "size" -> "1024")
    val channel2 = new FlumeChannel("channel2", "memory", channel2Properties)

    val connection1 = new FlumeConnection("source1", "channel1")
    val connection2 = new FlumeConnection("source1", "channel2")
    val connection3 = new FlumeConnection("channel1", "sink1")
    val connection4 = new FlumeConnection("channel2", "sink2")

    val agent = new FlumePipeline("agent_name",
      List(source), List(sink1, sink2), List(channel1, channel2),
      List(connection1, connection2, connection3, connection4))

    val config = converter.toTextConfig(agent)
    config should  be ("agent_name.sources = source1\n" +
                       "agent_name.sinks = sink1 sink2\n" +
                       "agent_name.channels = channel1 channel2\n\n" +
                       "agent_name.sources.source1.type = avro\n" +
                       "agent_name.sources.source1.hostname = localhost\n" +
                       "agent_name.sources.source1.port = 1111\n" +
                       "agent_name.sources.source1.channels = channel1 channel2\n" +
                       "agent_name.sinks.sink1.type = hdfs\n" +
                       "agent_name.sinks.sink1.hostname = 192.168.1.1\n" +
                       "agent_name.sinks.sink1.port = 8888\n" +
                       "agent_name.sinks.sink1.channel = channel1\n" +
                       "agent_name.sinks.sink2.type = avro\n" +
                       "agent_name.sinks.sink2.hostname = 192.168.1.2\n" +
                       "agent_name.sinks.sink2.port = 9999\n" +
                       "agent_name.sinks.sink2.channel = channel2\n" +
                       "agent_name.channels.channel1.type = memory\n" +
                       "agent_name.channels.channel1.size = 1024\n" +
                       "agent_name.channels.channel2.type = memory\n" +
                       "agent_name.channels.channel2.size = 1024")
  }

  "source without channels" should "be converted without channels property" in {
    val sourceProperties = Map("type" -> "avro", "hostname" -> "localhost", "port" -> "1111")
    val source = new FlumeSource("source1", "avro", sourceProperties)

    val sourceConfig = converter.toTextConfig(source, "agent_name", List.empty)

    sourceConfig should be ("agent_name.sources.source1.type = avro\n" +
                            "agent_name.sources.source1.hostname = localhost\n" +
                            "agent_name.sources.source1.port = 1111")
  }
  
  "empty pipeline" should "be converted to text and back" in {
    val agentName = "agent_1"
    val pipeline = FlumePipeline(agentName, List.empty, List.empty, List.empty, List.empty)
    val textConfig = converter.toTextConfig(pipeline)

    val pipeline2 = converter.toFlumePipeline(textConfig)
    pipeline2.agentName should be (agentName)
    pipeline.sources shouldBe 'empty
    pipeline.sinks shouldBe 'empty
    pipeline.channels shouldBe 'empty
  }
}
