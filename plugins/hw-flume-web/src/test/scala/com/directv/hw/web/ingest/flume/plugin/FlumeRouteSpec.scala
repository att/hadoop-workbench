package com.directv.hw.web.ingest.flume.plugin

import org.scalamock.scalatest.MockFactory
import org.scalatest.{FlatSpec, Matchers}
import spray.routing._
import spray.testkit.ScalatestRouteTest

// TODO (vkolischuk) rewrite according to file service api
class FlumeRouteSpec extends FlatSpec with Matchers with Directives with MockFactory with FlumeJsonFormats with ScalatestRouteTest {
//  private val servicePath = new ServiceId(1, "cluster-1", "flume-Service-1")
//  private val userName = "user"
//  private val pluginId = "flume-web"
//
//  private val flumeServices = scala.collection.mutable.Map[Int, FlumeService]()
//  private val simplePersistenceService = new SimplePersistenceService
//
//  val flumeServiceRouterMock = mock[FlumeServiceRouter]
//  val flumeTemplateServiceMock = mock[FlumeTemplateService]
//  val flumeExtendedServiceMock = mock[FlumeExtendedService]
//  val pluginManagerMock = mock[DapPluginManager]
//  val pluginDescriptorMock = mock[PluginDescriptor]
//
//  val hadoopServiceRegistryMock = mock[HadoopServiceRegistry]
//  val coreResourcesMock = mock[CoreResources]
//  (coreResourcesMock.getFlumeServiceRouter _).expects().noMoreThanOnce().returns(flumeServiceRouterMock)
//  (coreResourcesMock.getPropertyService _).expects().noMoreThanOnce().returns(simplePersistenceService)
//  (coreResourcesMock.getPluginManager _).expects().times().once().returns(pluginManagerMock)
//  (coreResourcesMock.getHadoopServiceRegistry _).expects().times().once().returns(hadoopServiceRegistryMock)
//  (coreResourcesMock.getFlumeTemplateService _).expects().times().once().returns(flumeTemplateServiceMock)
//  (coreResourcesMock.getFlumeExtendedService _).expects().times().once().returns(flumeExtendedServiceMock)
//
//  (hadoopServiceRegistryMock.registerService _).expects("flume", "").times().once().returns(("flume", ""))
//  (pluginManagerMock.getPluginDescriptor _).expects(*).times().once().returns(pluginDescriptorMock)
//  (pluginDescriptorMock.getPluginId _).expects().times().once().returns(pluginId)
//
//  val plugin = new FlumeWebPlugin
//  plugin.init(coreResourcesMock)
//  val flumeRoute = plugin.getRoute(userName)
//
//  val rootRestPath = s"/$pluginId/api/v1.0"
//  def serviceRestPath(servicePath: ServiceId, path: String) = {
//    rootRestPath +
//      s"/platforms/${servicePath.platformId}/clusters/${servicePath.clusterId}/services/${servicePath.serviceId}" +
//      s"/$path"
//  }
//
//
//
//  "Flume REST" should "CRUD agent config" in {
//
//    (flumeServiceRouterMock.getFlumeService _).expects(servicePath.platformId).repeat(7)
//      .returning(flumeServices.getOrElseUpdate(servicePath.platformId, new SimpleFlumeService))
//
//    val plugins = List(ArtifactPath("test", "test", "1.0", "jar"))
//    val files = List("lib.jar")
//    (flumeExtendedServiceMock.getPluginDependencies _).expects(*).repeat(3).returning(plugins)
//    (flumeExtendedServiceMock.getFiles _).expects(*).repeat(3).returning(files)
//    (flumeExtendedServiceMock.deleteConfig _).expects(*).once()
//
//    val agentsPath = serviceRestPath(servicePath, "agents")
//    def agentPath(id: String) = serviceRestPath(servicePath, s"agents/$id")
//    def filePath(id: String, file: String, format: Option[String]) = {
//      val formatParam = format.map(f => s"&format=$f").getOrElse("")
//      serviceRestPath(servicePath, s"agents/$id?file=$file$formatParam")
//    }
//
//    def assertAgent(agentId: String, title: String, graph: FlumeGraph) = {
//      Get(agentPath(agentId)) ~> flumeRoute ~> check {
////        System.out.println(response.entity.asString)
//        response.status should be(StatusCodes.OK)
//        val readAgent = unmarshallResponse[WebFlumeAgent]
//        readAgent.title should be(title)
//      }
//      Get(filePath(agentId, FileTypes.pipelinePseudoFile, Some(FileTypes.pipeline))) ~> flumeRoute ~> check {
////        System.out.println(response.entity.asString)
//        response.status should be(StatusCodes.OK)
//        val readAgent = unmarshallResponse[FileContent]
//        responseAs[String].parseJson.asJsObject.getFields("data").head.convertTo[T]
//        readAgent.id should be(Some(agentId))
//        readAgent.name should be(saved.name)
//        readAgent.title should be(saved.title)
//        readAgent.nodes.map(_.id).toSet should be(saved.nodes.map(_.id).toSet)
//        readAgent.connections.map(c => (c.from, c.to)).toSet should be (saved.connections.map(c => (c.from, c.to)).toSet)
//        readAgent.dependencies.get should have size 1
//        readAgent.files.get should have size 1
//      }
//    }
//
//    def listAgentIds = {
//      flumeServices.get(servicePath.platformId).get
//        .getAgentsInfo(servicePath.relativeServicePath)
//        .map(_.id).toSet
//    }
//
//    /** ************
//    Create Agent 1
//      * *************/
//    val agent1 = createGraph(1)
//
//    val agentId1 = Post(agentsPath, agent1) ~> flumeRoute ~> check {
//      response.status should be(StatusCodes.OK)
//      unmarshalResponse[CreatedModule].moduleId
//    }
//
//    listAgentIds should be(Set(agentId1))
//
//    assertAgent(agentId1, agent1)
//
//    /** ************
//    Create Agent 2
//      * *************/
//    val agent2 = createAgent(None, 2)
//
//    val agentId2 = Post(agentsPath, agent2) ~> flumeRoute ~> check {
//      response.status should be(StatusCodes.OK)
//      unmarshalResponse[CreatedModule].moduleId
//    }
//
//    listAgentIds should be(Set(agentId1, agentId2))
//
//    assertAgent(agentId2, agent2)
//
//    /** ************
//    Update Agent 1
//      * *************/
//    val agent3 = createAgent(Some(agentId1), 3).copy(connections = List())
//
//    Put(agentsPath, agent3) ~> flumeRoute ~> check {
//      response.status should be(StatusCodes.OK)
//    }
//
//    listAgentIds should be(Set(agentId1, agentId2))
//
//    assertAgent(agentId1, agent3)
//
//    /** ************
//    Delete Agent 1
//      * *************/
//    Delete(agentPath(agentId1)) ~> flumeRoute ~> check {
//      response.status should be(StatusCodes.OK)
//    }
//
//    listAgentIds should be(Set(agentId2))
//  }
//
//  "Flume REST" should "validate" in {
//
//    val agentsPath = serviceRestPath(servicePath, "agents")
//    def assertBadRequest(agent: Module) = {
//      Post(agentsPath, agent) ~> flumeRoute ~> check {
//        response.status should be(StatusCodes.BadRequest)
//        val jsonText = responseAs[String]
//        jsonText.parseJson.asJsObject.getFields("message").head.compactPrint
//          .replaceAll("\\s+", "").isEmpty should be(right = false)
//      }
//    }
//
//    val agent = createAgent(None, 1)
//
//    // empty title
//    assertBadRequest(agent.copy(title = ""))
//
//    // empty name
//    assertBadRequest(agent.copy(name = ""))
//
//    // empty node id
//    val nodes3 = agent.nodes.map { node =>
//      if (node.`type` == sourceType) {
//        node.copy(id = "")
//      } else {
//        node
//      }
//    }
//    assertBadRequest(agent.copy(nodes = nodes3))
//
//    // connection source -> source
//    val connections4a = {
//      val node = agent.nodes.find(_.`type` == sourceType).get
//      List(Connection(node.id, node.id))
//    }
//    assertBadRequest(agent.copy(connections = connections4a))
//
//    // connection source -> sink
//    val connections4b = {
//      val nodeFrom = agent.nodes.find(_.`type` == sourceType).get
//      val nodeTo = agent.nodes.find(_.`type` == sinkType).get
//      List(Connection(nodeFrom.id, nodeTo.id))
//    }
//    assertBadRequest(agent.copy(connections = connections4b))
//
//    // two connections channel -> the same sink
//    val nodes4c = agent.nodes :+ Node("chanel2", "channel", "file", Map(), Position(1, 1))
//    val connections4c = {
//      val nodeTo = nodes4c.find(_.`type` == sinkType).get
//      nodes4c.filter(_.`type` == channelType).map { node =>
//        Connection(node.id, nodeTo.id)
//      }
//    }
//    assertBadRequest (agent.copy(nodes = nodes4c, connections = connections4c))
//  }
//
//
//  "Flume REST" should "get flume template" in {
//
//    val configOpt = managed(getClass.getClassLoader.getResourceAsStream("test/clousera/flume/test.properties")) map {input =>
//      fromInputStream(input).getLines().mkString("\n")
//    }
//
//    val config = configOpt.opt.get
//
//    val templateId: Int = 1
//    val agentName = "testAgent"
//    val agentConfig = AgentConfig(None, agentName, agentName, config)
//    val extendedAgentConfig = ExtendedAgentConfig(agentConfig, List(ArtifactPath("groupId", "artifactId", "version", "ext")), List("lib.jar"))
//
//    (flumeTemplateServiceMock.getAgentConfig _).expects(templateId).times().once().returns(extendedAgentConfig)
//
//    Get(rootRestPath + "/templates/agents/1") ~> flumeRoute ~> check {
//      response.status should be(StatusCodes.OK)
//      val responseModule = unmarshalResponse[Module]
//      responseModule.id should be(None)
//      responseModule.name should be(agentName)
//      responseModule.title should be(agentName)
//      responseModule.nodes should have size 5
//      responseModule.connections should have size 5
//      responseModule.dependencies shouldBe defined
//      responseModule.dependencies.get should have size 1
//      responseModule.files shouldBe defined
//      responseModule.files.get should have size 1
//    }
//
//  }
//
//  "Flume REST" should "get agent instances" in {
//
//    (flumeServiceRouterMock.getFlumeService _).expects(servicePath.platformId).repeat(1)
//      .returning(flumeServices.getOrElseUpdate(servicePath.platformId, new SimpleFlumeService))
//
//    val extendedInstances = List(
//      ExtendedAgentInstance("instance1", "host1", "active", provisioned = true),
//      ExtendedAgentInstance("instance2", "host2", "stopped", provisioned = false)
//    )
//
//
//    val agentId = "agent1"
//    (flumeExtendedServiceMock.enhanceFlumeInstances _).expects(*, *).repeat(1).returning(extendedInstances)
//
//    val restPath = serviceRestPath(servicePath, s"agents/$agentId/instances")
//
//    Get(restPath) ~> flumeRoute ~> check {
//      response.status should be(StatusCodes.OK)
//      val instances = unmarshallResponse[AgentInstances].instances
//      instances should have size 2
//
//      instances.head.name should be ("instance1")
//      instances.head.host should be ("host1")
//      instances.head.state should be ("active")
//      instances.head.provisioned should be (right = true)
//
//      instances.last.name should be ("instance2")
//      instances.last.host should be ("host2")
//      instances.last.state should be ("stopped")
//      instances.last.provisioned should be (right = false)
//    }
//  }
//
//  private def emptyGraph(n: Int): FlumeGraph = {
//    FlumeGraph(agentName(n), List.empty, List.empty, None)
//  }
//
//  private def createGraph(n: Int): FlumeGraph = {
//    val src1 = s"source${n}_1"
//    val cnl1 = s"channel${n}_1"
//    val snk1 = s"sink${n}_1"
//    val nodes = Map(
//      src1 -> Node(src1, "source", "avro", Map(), Position(0, 0)),
//      cnl1 -> Node(cnl1, "channel", "memory", Map(), Position(1, 0)),
//      snk1 -> Node(snk1, "sink", "avro", Map(), Position(2, 0))
//    )
//    val connections = List(
//      Connection(nodes.get(src1).get.id, nodes.get(cnl1).get.id),
//      Connection(nodes.get(cnl1).get.id, nodes.get(snk1).get.id)
//    )
//
//    FlumeGraph(agentName(n), nodes.values.toList, connections, Some(VisualProperties(positionTypeGrid)))
//  }
//
//  private def agentName(n: Int) = s"agent$n"
//
//  private def unmarshallResponse[T](implicit jsonFormat: JsonFormat[T]): T = {
//    response.status should be(StatusCodes.OK)
//    val jsonText = responseAs[String]
//    jsonText.parseJson.asJsObject.getFields("data").head.convertTo[T]
//  }
//
//  private class SimpleFlumeService extends FlumeService {
//    private val agents = scala.collection.mutable.Map[String, AgentConfig]()
//
//    override def getAgentConfiguration(modulePath: RelativeModulePath): AgentConfig = {
//      agents.get(modulePath.moduleId).get
//    }
//
//    override def getAgentsInfo(servicePath: RelativeServicePath): List[AgentInfo] = {
//      agents.values.map { agentConfig =>
//        AgentInfo(agentConfig.id.get, agentConfig.title)
//      }.toList
//    }
//
//    override def createAgentConfiguration(servicePath: RelativeServicePath, agentConfig: AgentConfig): String = {
//      val id = s"flume-agent-${System.currentTimeMillis()}"
//      val copy = agentConfig.copy(Some(id))
//      agents.put(id, copy)
//      id
//    }
//
//    override def deleteAgentConfiguration(modulePath: RelativeModulePath) = {
//      agents.remove(modulePath.moduleId)
//    }
//
//    override def updateAgentConfiguration(servicePath: RelativeServicePath, agentConfig: AgentConfig) = {
//      agents.put(agentConfig.id.get, agentConfig)
//    }
//
//    override def getAgentInstances(modulePath: RelativeModulePath): List[AgentInstance] = {
//      List(
//        AgentInstance("instance1", "host1", "active"),
//        AgentInstance("instance2", "host2", "stopped")
//      )
//    }
//
//    override def getFlumePluginDirs(modulePath: RelativeModulePath): List[String] = {
//      List (
//        "/dir1",
//        "/dir2"
//      )
//    }
//  }
//
//  private class SimplePersistenceService extends PropertyService {
//    private val properties = scala.collection.mutable.Map[(String, String, String), scala.collection.mutable.Map[String, String]]()
//
//    override def getValue(modulePath: ModulePath, key: String, pluginId: String, user: String): String = {
//      properties.get(pluginId, "", key).flatMap(_.get(user)).orNull
//    }
//
//    override def saveValue(modulePath: ModulePath, key: String, pluginId: String, user: String, value: String): Unit = {
//      properties
//        .getOrElseUpdate((pluginId, "", key), scala.collection.mutable.Map[String, String]())
//        .put("", value)
//    }
//
//    override def delete(modulePath: ModulePath, key: String, pluginId: String, user: String) = {
//      properties.remove(pluginId, "", key)
//    }
//
//    override def delete(modulePath: ModulePath, key: String, pluginId: String): Unit = {
//      properties.remove(pluginId, "", key)
//    }
//  }
//
}
