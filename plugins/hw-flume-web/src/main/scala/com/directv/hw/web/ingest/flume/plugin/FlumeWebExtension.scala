package com.directv.hw.web.ingest.flume.plugin

import java.io.InputStream

import com.directv.hw.common.io.DapIoUtils._
import com.directv.hw.common.web.{FilesRoute, WebCommon}
import com.directv.hw.core.auth.UserSecurityContext
import com.directv.hw.core.exception.{CalleeException, DapException, ServerError}
import com.directv.hw.core.plugin.web.WebExtension
import com.directv.hw.core.service.{AppConf, HadoopServiceRegistry, HadoopServiceTypes}
import com.directv.hw.hadoop.access.AccessManagerService
import com.directv.hw.hadoop.config.FlumeConfigurationProcessor
import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.host.model.PlatformHost
import com.directv.hw.hadoop.flume.converter.FlumeConverter
import com.directv.hw.hadoop.flume.model._
import com.directv.hw.hadoop.flume.routing.FlumeServiceRouter
import com.directv.hw.hadoop.flume.service.{FlumeFiles, FlumeLocalRepo, FlumeService}
import com.directv.hw.hadoop.metrics.{MetricsAssignmentList, MetricsAssignmentRepo}
import com.directv.hw.hadoop.model._
import com.directv.hw.hadoop.platform.service.PlatformManager
import com.directv.hw.hadoop.template.injest.flume.model.{AgentElementTemplate, AgentTemplate}
import com.directv.hw.hadoop.template.injest.flume.service.{FlumeElementTenantRepo, FlumeTenantRepo}
import com.directv.hw.hadoop.template.model.{ComponentInfo, UpdateTemplateInfo}
import com.directv.hw.web.ingest.flume.model._
import com.directv.hw.web.ingest.flume.scaldi.FlumeModule
import com.directv.hw.web.ingest.flume.service._
import com.typesafe.scalalogging.LazyLogging
import ro.fortsoft.pf4j._
import scaldi.{Injectable, Injector}
import spray.http.StatusCodes
import spray.routing.Route

import scala.annotation.tailrec
import scala.language.postfixOps
import scala.util.{Failure, Success, Try}
class FlumeWebPlugin(pluginWrapper: PluginWrapper) extends Plugin(pluginWrapper)

@Extension
class FlumeWebExtension(implicit injector: Injector) extends WebExtension with WebCommon with FilesRoute with FlumeJsonFormats
    with Injectable with LazyLogging {

  implicit val diContext: FlumeModule = new FlumeModule()(injector)

  private val registry = inject[HadoopServiceRegistry]
  registry.registerType(HadoopServiceTypes.flume, None)

  private val flumeRouter = inject[FlumeServiceRouter]
  private val flumeTemplateService = inject[FlumeTenantRepo]
  private val flumeTemplatePersistenceService = inject[FlumeTemplatePersistenceService]
  private val flumeElementTemplateService = inject[FlumeElementTenantRepo]
  private val flumeLocalRepo = inject[FlumeLocalRepo]
  private val flumePersistenceService = inject[FlumePersistenceService]
  private val flumeConverter = inject[FlumeConverter]
  private val accessManager = inject[AccessManagerService]
  private val pluginInfo = inject[PluginDescriptor]
  private val platformService = inject[PlatformManager]
  private val templateProcessor = inject[FlumeConfigurationProcessor]
  private val metricsAssignmentRepo = inject[MetricsAssignmentRepo]

  private val timeoutMillis = inject[AppConf].outgoingHttpRqTimeoutMs

  private lazy val typeMetadata = loadResourceAsString("FlumeTypeMetadata.json")
  private lazy val subtypeMetadata = loadResourceAsString("FlumeSubtypeMetadata.json")

  override def route: UserSecurityContext => Route = { userContext: UserSecurityContext =>
    pathPrefix(pluginInfo.getPluginId) {
      pathPrefix("api") {
        pathPrefix("v1.0") {
          pathPrefix("platforms" / IntNumber) { platformId =>
            pathPrefix("clusters" / Segment) { clusterId =>
              pathPrefix("services" / Segment) { serviceId =>
                pathPrefix("agents") {
                  agentsRoute(new ServicePath(platformId, clusterId, serviceId), userContext)
                }
              }
            }
          } ~
          pathPrefix("metadata") {
            get {
              path("types") {
                completeJsonResponse(typeMetadata)
              } ~
              path("subtypes") {
                completeJsonResponse(subtypeMetadata)
              }
            }
          } ~
          pathPrefix("templates") {
            templatesRoute(userContext)
          } ~
          path("deploy") {
            post {
              ensureEntity[DeploymentInfo] { info =>
                complete {
                  deploy(info, userContext.user)
                }
              }
            }
          }
        }
      }
    }
  }

  private def agentsRoute[T](servicePath: ServicePath, userContext: UserSecurityContext): Route = {

    implicit val flumeService = getService(servicePath.platformId)
    pathPrefix(Segment) { moduleId =>
      val modulePath = new ModulePath(servicePath, moduleId)
      lazy val contentService = FlumePlatformContentService(modulePath, userContext.user)
      lazy val relativeModulePath = modulePath.relativeModulePath

      instancesRoute(modulePath, userContext.user) ~
      simpleFilesRoute(userContext, contentService) ~
      get {
        parameter("metrics") {
          case "assignments" =>
            complete(MetricsAssignmentList(metricsAssignmentRepo.getAssignments(modulePath)))
        } ~
        complete {
          val agent = flumeService.getComponentConfig(relativeModulePath)
          toWebModel(agent, contentService, modulePath, userContext.user)
        }
      } ~
      put { // update agent
        ensureEntity[UpdateAgentRequest] { request =>
          complete {
            val config = FlumeComponentUpdate(request.name, request.agentName, request.pluginDir)
            flumeService.updateComponentConfig(relativeModulePath, config)
            // todo: vvozdroganov - why options?
            saveToCache(modulePath, request.name.getOrElse(""), request.agentName.getOrElse(""))
            StatusCodes.OK
          }
        }
      } ~
      delete { // delete agent by ID
        parameter("force".as[Boolean]?) { force =>
          complete {
            val forceDelete = force getOrElse false
            deleteAgent(flumeService, modulePath, forceDelete)
            StatusCodes.OK
          }
        }
      }
    } ~
    get { // get list of all agents (IDs and titles)
      complete {
        AgentInfoList(flumeService.listComponents(servicePath.relativeServicePath))
      }
    }
  }

  private def instancesRoute[T](implicit modulePath: ModulePath, user: String): Route = {
    val relativeModulePath = modulePath.relativeModulePath
    implicit val flumeService = getService(modulePath.platformId)

    pathPrefix("instances") {
      pathPrefix(Segment) { instanceId =>
        pathPrefix("config") {
          put {
            ensureEntity[UpdateInstanceRequest] { request =>
              complete {
                val config = FlumeComponentUpdate(agentName = request.agentName, pluginDir = request.pluginDir)
                flumeService.updateInstanceComponentConfig(relativeModulePath, instanceId, config)
                flumeLocalRepo.onInstanceUpdate(modulePath, instanceId)
                StatusCodes.OK
              }
            }
          }
        } ~
        post {
          parameter("action") {
            case "start" =>
              complete {
                flumeService.startAgentInstance(relativeModulePath, instanceId)
                StatusCodes.OK
              }
            case "stop" =>
              complete {
                flumeService.stopAgentInstance(relativeModulePath, instanceId)
                StatusCodes.OK
              }
            case other =>
              complete(throw new ServerError(s"Unknown action: [$other]"))
          }
        } ~
        delete {
          complete {
            deleteInstance(flumeService, modulePath, instanceId)
            StatusCodes.OK
          }
        }
      } ~
      get {
        complete(makeWebInstances(executeSync(makeSyncTargets, flumeLocalRepo.getSyncStatus)))
      } ~
      post {
        parameter("action") {
          case "pull" =>
            complete {
              ensureSyncSuccessful {
                executeSync(makeSyncTargets, flumeLocalRepo.pullPlugins)
              }

              StatusCodes.OK
            }
          case "push" =>
            complete {
              ensureSyncSuccessful{
                executeSync(makeSyncTargetsForPush, flumeLocalRepo.pushPlugins)
              }

              StatusCodes.OK
            }
          case "refresh" =>
            complete {
              val instances = makeWebInstances(executeSync(makeSyncTargets, flumeLocalRepo.refreshSync))
              instances
            }

          case "wipe" =>
            complete {
              val instances = makeWebInstances(executeSync(makeSyncTargets, flumeLocalRepo.deletePlugins))
              instances
            }

          case other =>
            throw new ServerError(s"Unknown action: $other")
        }
      } ~
      ensureEntity[CreateInstanceRequest] { request =>
        complete {
          CreatedInstanceResponse(createInstance(request, flumeService, modulePath))
        }
      }
    }
  }

  private case class EnhancedInstances(instancesData: AgentInstancesData, state: SyncState)

  private def makeSyncTargets(instances: List[AgentInstance])(implicit flumeService: FlumeService, modulePath: ModulePath): List[SyncTarget] = {
    val config = flumeService.getComponentConfig(modulePath.relativeModulePath)
    instances map { instance =>
      makeSyncTarget(instance, config.name)
    }
  }

  private def makeSyncTargetsForPush(instances: List[AgentInstance])
                                    (implicit flumeService: FlumeService, modulePath: ModulePath): List[SyncTarget] = {

    instances withFilter (i => i.state == InstanceState.STARTED || i.state == InstanceState.BUSY) foreach { _ =>
      throw new ServerError(s"All instances should be stopped")
    }

    val relativeModulePath = modulePath.relativeModulePath
    val config = flumeService.getComponentConfig(relativeModulePath)
    instances map { instance =>
      val pluginDir = config.pluginDir
      val instanceFoPush = if (pluginDir == instance.config.pluginDir) {
        instance
      } else {
        flumeService.updateInstanceComponentConfig(relativeModulePath, instance.id, FlumeComponentUpdate(pluginDir = Some(pluginDir)))
        instance.copy(config = instance.config.copy(pluginDir = pluginDir))
      }
      makeSyncTarget(instanceFoPush, config.name)
    }
  }

  private def executeSync(makeTargets: List[AgentInstance] => List[SyncTarget],
                          sync: (ModulePath, List[SyncTarget]) => SyncState)
                         (implicit flumeService: FlumeService, modulePath: ModulePath) =  {
    val data = flumeService.getInstances(modulePath.relativeModulePath)

    val targets = makeTargets(data.instances)

    val syncState = sync(modulePath, targets)

    EnhancedInstances(data, syncState)
  }

  private def ensureSyncSuccessful(enhanced: EnhancedInstances) = {
    enhanced.state.instances foreach { instance =>
      instance.result match {
        case error: SyncError =>
          val errorMessage = error.error
          val host = enhanced.instancesData.instances.find(_.id == instance.id).get.host
          throw new DapException(s"Instance ${displayHostName(host)} was not synchronized: $errorMessage")
        case _ =>
      }
    }
  }

  private def makeWebInstances(enhanced: EnhancedInstances): AgentInstances = {
    val syncState = enhanced.state
    val instancesData = enhanced.instancesData
    val syncedInstances = syncState.instances map (instance => instance.id -> instance.result) toMap
    val extInstances = enhanced.instancesData.instances map { i => toWebInstance(i, syncedInstances.get(i.id)) }
    AgentInstances(extInstances, instancesData.availableHosts)
  }

  private def toWebInstance(instance: AgentInstance, syncResult: Option[SyncResult]) = {
    import InstanceHealth._
    val healthMessage = instance.health match {
      case BAD | CONCERNING => Some(s"Instance health is [${instance.health}]")
      case _ => Unit
    }

    val syncMessage = syncResult match {
      case Some(_: SyncError) => Some("Plugin synchronization error")
      case None | Some(SyncRequired) => Some("Plugin synchronization required")
      case _ => None
    }

    val staleMessage = if(instance.isStale) {
      Some("Agent config is stale")
    } else {
      None
    }

    val errorMessages = List(healthMessage, staleMessage, syncMessage) collect {
      case Some(message: String) => message
    }

    WebAgentInstance(instance.id, instance.host, instance.state.toString,
      instance.config.agentName, instance.config.pluginDir,
      errorMessages)
  }

  private def createInstance(request: CreateInstanceRequest, flumeService: FlumeService, modulePath: ModulePath) = {
    val relativeModulePath = modulePath.relativeModulePath

    val instance = flumeService.createInstance(relativeModulePath, request.hostId)

    val config = flumeService.getComponentConfig(relativeModulePath)
    val target = makeSyncTarget(instance, config.name)
    val instanceSync = flumeLocalRepo.addSyncTarget(modulePath, target)
    instanceSync.result match {
      case e: SyncError => throw new DapException(s"Error pushing plugins: ${e.error}")
      case _ =>
    }
    instance.id
  }

  private def deleteAgent(flumeService: FlumeService, modulePath: ModulePath, forceDelete: Boolean) = {
    val relativeModulePath = modulePath.relativeModulePath

    if(forceDelete) {
      stopInstances(flumeService, relativeModulePath)
    }

    val data = flumeService.getInstances(relativeModulePath)

    data.instances foreach { instance =>
      if(instance.state != InstanceState.STOPPED) {
        throw new ServerError(s"All instances must be stopped")
      }
    }

    val config = flumeService.getComponentConfig(relativeModulePath)
    data.instances foreach { instance =>
      flumeService.deleteInstance(relativeModulePath, instance.id)
      val syncTarget = makeSyncTarget(instance, config.name)
      flumeLocalRepo.deleteSyncTarget(modulePath, syncTarget)
    }

    flumeService.deleteComponent(relativeModulePath)

    flumeLocalRepo.deleteAgentFiles(modulePath)
    flumeLocalRepo.deleteComponent(modulePath)

    flumePersistenceService.deletePositioning(modulePath)
  }

  private def stopInstances(flumeService: FlumeService, relativeModulePath: RelativeModulePath): Unit = {
    val stopped = true
    val inProgress = false

    def tryStopInstances(): Boolean = {
      flumeService.getInstances(relativeModulePath).instances.foldLeft(stopped) { (allStopped, instance) =>
        val instanceStoppedStatus = instance.state match {
          case InstanceState.STARTED | InstanceState.UNKNOWN =>
            Try {
              val afterStop = flumeService.stopAgentInstance(relativeModulePath, instance.id)
              if(afterStop.state == InstanceState.STOPPED) {
                stopped
              } else {
                inProgress
              }
            } recoverWith {
              case e: Exception =>
                logger.error(s"Error stopping instance $relativeModulePath - ${instance.id}", e)
                Success(inProgress)
            } get
          case InstanceState.STOPPED =>
            stopped
          case InstanceState.BUSY =>
            inProgress
          case _ =>
            throw new DapException(s"Server error")
        }
        instanceStoppedStatus && allStopped
      }
    }

    @tailrec
    def forceStopInstances(remainingTimeMillis: Long): Boolean = {
      if (remainingTimeMillis <= 0) {
        inProgress
      } else {
        val startTimestamp = System.currentTimeMillis()
        tryStopInstances() match {
          case `stopped` =>
            stopped
          case `inProgress` =>
            val newRemaining = remainingTimeMillis - (System.currentTimeMillis() - startTimestamp)
            forceStopInstances(newRemaining)
          case other =>
            throw new DapException(s"Server error: $other")
        }
      }
    }

    // TODO (vkolischuk) parameter for instance timeout
    if(!forceStopInstances(timeoutMillis * 20)) {
      throw new DapException(s"Some instances have not stopped")
    }
  }

  private def deleteInstance(flumeService: FlumeService, modulePath: ModulePath, instanceId: String) = {
    flumeService.getInstances(modulePath.relativeModulePath).instances withFilter(_.id == instanceId) foreach { instance =>
      val config = flumeService.getComponentConfig(modulePath.relativeModulePath)
      flumeLocalRepo.deleteSyncTarget(modulePath, makeSyncTarget(instance, config.name))
    }
    flumeService.deleteInstance(modulePath.relativeModulePath, instanceId)
  }

  private def findPluginDirs(platformId: Int): List[String] = {
    accessManager.findPlatformAccess(platformId) map (_.pluginDirs) getOrElse List.empty
  }

  private def makeSyncTarget(instance: AgentInstance, name: String) = {
    val pluginDir = instance.config.pluginDir
    val subDir = name.replaceAll("[^a-zA-Z0-9\\-_.]+", "")
    SyncTarget(instance.id, instance.host, pluginDir, subDir)
  }

  private def displayHostName(host: PlatformHost) = host.hostname getOrElse host.ip

  private def templatesRoute(userContext: UserSecurityContext): Route = {
    path("mustache") {
      complete(MustacheProperties(flumeTemplateService.mustacheProperties))
    } ~
    pathPrefix("agents") {
      pathPrefix(IntNumber) { templateId =>
        simpleFilesRoute(userContext, FlumeTemplateContentService(templateId, userContext.user)) ~
        get {
          complete(getAgentFromTemplate(templateId))
        } ~
        put {
          ensureEntity[UpdateAgentTemplateRequest] { request =>
            val info = UpdateTemplateInfo(request.name, request.version, request.description, request.team)
            complete {
              updateAgentTemplate(templateId, info, userContext.user)
              StatusCodes.OK
            }
          }
        }
      } ~
      get {
        complete(FlumeTemplates(flumeTemplateService.getAllTemplates))
      } ~
      post {
        ensureEntity[NewAgentTemplateRequest] { request =>
          complete(CreatedTemplate(createTemplate(request, userContext.user).info.id))
        }
      }
    } ~
    pathPrefix("elements") {
      pathPrefix(IntNumber) { templateId =>
        simpleFilesRoute(userContext, FlumeTemplateContentService(templateId, userContext.user)) ~
        get {
          complete(getAgentElementFromTemplate(templateId))
        }
      } ~
      get {
        parameter("type") { elementType =>
          complete(FlumeElementTemplates(flumeElementTemplateService.findByElementType(elementType)))
        } ~
        complete(FlumeElementTemplates(flumeElementTemplateService.getAllTemplates))
      } ~
      post {
        ensureEntity[NewAgentElementTemplateRequest] { request =>
          complete(CreatedTemplate(createElementTemplate(request).info.id))
        }
      }
    }
  }

  private def updateAgentTemplate(templateId: Int, info: UpdateTemplateInfo, user: String) = {
    flumeTemplateService.updateComponentInfo(templateId, info)
  }

  private def getAgentFromTemplate(templateId: Int): WebFlumeAgent = {
    val template = flumeTemplateService.getTemplate(templateId)
    val files = flumeTemplateService.getFileService(templateId).listFiles()
    WebFlumeAgent(template.info.name, "", "", files, isBase = None, component = Some(template.info))
  }

  private def getAgentElementFromTemplate(templateId: Int) = {
    val template = flumeElementTemplateService.getTemplate(templateId)

    val fileService = flumeElementTemplateService.getFileService(templateId)
    val files = fileService.listFiles()

    val node = flumeElementTemplateService.getNode(templateId)

    WebFlumeElement(template.elementType, template.elementSubtype, files, node.properties)
  }

  private def createTemplate(request: NewAgentTemplateRequest, user: String) = {
    val name = request.name getOrElse request.agentName
    val agentName = request.agentName
    val info = ComponentInfo(-1, request.tenantId, ComponentTypes.flume, name, request.version, request.description)

    val template = request.templateId match {
      case Some(templateId) =>
        val sourceId = templateId
        val createdTemplate = flumeTemplateService.copyTemplate(sourceId, AgentTemplate(info))
        val sourceConfig = flumeTemplateService.getFileService(sourceId).getFileContent(FlumeFiles.flumeConf)
        val sourcePipeline = flumeConverter.toFlumePipeline(sourceConfig)
        val targetPipeline = sourcePipeline.copy(agentName = agentName)
        val targetConfig = flumeConverter.toTextConfig(targetPipeline)
        flumeTemplateService.getFileService(createdTemplate.info.id).saveFileContent(FlumeFiles.flumeConf, targetConfig)
        createdTemplate
      case None =>
        val createdTemplate = flumeTemplateService.createTemplate(AgentTemplate(info))
        val emptyModel = FlumePipeline(agentName, List.empty, List.empty, List.empty, List.empty)
        val agentConfig = flumeConverter.toTextConfig(emptyModel)
        flumeTemplateService.getFileService(createdTemplate.info.id).saveFileContent(FlumeFiles.flumeConf, agentConfig)
        createdTemplate
    }

    template
  }

  private def createElementTemplate(request: NewAgentElementTemplateRequest) = {
    val elementType = request.elementType
    val elementSubtype = request.elementSubtype
    val info = ComponentInfo(-1, request.tenantId, ComponentTypes.flume, request.name, request.version, request.description)

    if (request.templateId.nonEmpty) {
      val sourceId = request.templateId.get
      val sourceTemplate = flumeElementTemplateService.getTemplate(sourceId)

      val agentName = request.agentName getOrElse sourceTemplate.agentName
      val nodeName = request.nodeName getOrElse sourceTemplate.nodeName
      val template = AgentElementTemplate(elementType, elementSubtype, agentName, nodeName, info)
      val createdTemplate = flumeElementTemplateService.copyTemplate(sourceId, template)

      if (agentName != sourceTemplate.agentName || nodeName != sourceTemplate.nodeName) {
        val sourceModel = flumeElementTemplateService.getNode(sourceId)

        val targetModel = sourceModel match {
          case s: FlumeSource => FlumeSource(nodeName, s.nodeType, s.properties)
          case c: FlumeChannel => FlumeChannel(nodeName, c.nodeType, c.properties)
          case s: FlumeSink => FlumeSink(nodeName, s.nodeType, s.properties)
        }

        flumeElementTemplateService.updateNode(createdTemplate.info.id, targetModel, agentName)
      }

      createdTemplate
    } else {
      val agentName = request.agentName getOrElse "agent"
      val nodeName = request.nodeName getOrElse elementSubtype.replaceAll("^\\.+\\.", "")
      val template = AgentElementTemplate(elementType, elementSubtype, agentName, nodeName, info)
      val createdTemplate = flumeElementTemplateService.createTemplate(template)

      val model = elementType match {
        case FlumeConstants.sourceType => FlumeSource(nodeName, elementSubtype, Map.empty)
        case FlumeConstants.channelType => FlumeChannel(nodeName, elementSubtype, Map.empty)
        case FlumeConstants.sinkType => FlumeSink(nodeName, elementSubtype, Map.empty)
      }
      flumeElementTemplateService.updateNode(createdTemplate.info.id, model, agentName)

      createdTemplate
    }
  }

  private def deploy(info: DeploymentInfo, userName: String): DeploymentResult = {
    val servicePath = new ServicePath(info.platform, info.cluster, info.service)
    val flumeService = getService(info.platform)
    val componentName = info.name
    val moduleId = flumeService.createEmptyComponent(servicePath.relativeServicePath, componentName)
    val modulePath = new ModulePath(servicePath, moduleId)

    val fileService = flumeTemplateService.getFileService(info.templateId)
    val targetFileService = new FlumeComponentFS(flumeService, modulePath.relativeModulePath, flumeLocalRepo.getFileService(modulePath))
    copyAll(fileService, targetFileService)

    flumeTemplatePersistenceService.getPositioning(info.templateId, userName) foreach {
      flumePersistenceService.savePositioning(modulePath, userName, _)
    }

    val relativeModulePath = modulePath.relativeModulePath

    val pluginDirOpt = info.pluginDir orElse {
      findPluginDirs(info.platform).headOption map { rootPluginDir =>
        val dirName = componentName.replaceAll("[^a-zA-Z0-9\\-_]", "")
        rootPluginDir + "/" + info.service + "/" + dirName
      }
    }

    val textConfig = flumeService.getPipelineConfig(relativeModulePath)
    val pipeline = flumeConverter.toFlumePipeline(textConfig)
    val agentName = pipeline.agentName
    val agentConfigUpdate = FlumeComponentUpdate(agentName = Some(agentName), pluginDir = pluginDirOpt, name = Some(componentName))
    flumeService.updateComponentConfig(relativeModulePath, agentConfigUpdate)

    saveToCache(modulePath, componentName, agentName)
    val errrors = templateProcessor.renderFiles(targetFileService, modulePath)
    DeploymentResult(moduleId, errrors.messages.map(DeploymentError))
  }

  private def saveToCache(modulePath: ModulePath, componentName: String, agentName: String): Unit = {
    flumeLocalRepo.saveComponent(
      FlumeComponent(
        modulePath.platformId,
        modulePath.clusterId,
        modulePath.serviceId,
        modulePath.moduleId,
        componentName,
        agentName
      )
    )
  }

  private def toWebModel(config: FlumeComponentConfig, contentService: FlumeContentService, modulePath: ModulePath, userName: String): WebFlumeAgent = {
    val files = contentService.listFiles(ComponentFS.root)
    val platform = platformService.getBriefPlatform(modulePath.platformId)
    WebFlumeAgent(config.name, config.agentName, config.pluginDir, files, isBase = Some(config.isBase), platform = Some(platform))
  }

  private def getService(platformId: Int) = {
    flumeRouter.getFlumeService(platformId)
  }

  private def loadResourceAsString(path: String) = {
    managed2(getClass.getClassLoader.getResourceAsStream(path)) ({ is: InputStream =>
      scala.io.Source.fromInputStream(is).getLines().mkString("\n")
    }, {
      case e: Exception =>
        logger.error(s"Could not read resource [$path]", e)
        Failure(new CalleeException(s"Could not load resource [$path]"))
    })
  }
}
