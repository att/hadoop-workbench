package com.directv.hw.web.ingest.oozie.plugin

import com.directv.hw.common.web.{CommonJsonFormats, FilesRouteFormats}
import com.directv.hw.core.exception.{NotSupportedException, ServerError}
import com.directv.hw.hadoop.config.{ConfigEntry, MustacheProperty}
import com.directv.hw.hadoop.oozie.model._
import com.directv.hw.hadoop.mapred.{JobLog, JobLogTraces}
import com.directv.hw.hadoop.model._
import com.directv.hw.web.ingest.oozie.model._
import spray.json._

trait OozieJsonFormats extends CommonJsonFormats with FilesRouteFormats {

  implicit val workflowInfoFormat = jsonFormat4(WorkflowInfo)
  implicit val deploymentInfoFormat = jsonFormat8(OozieDeploymentInfo)
  implicit val connectionFormat = jsonFormat4(WebConnection)
  implicit val positionFormat = jsonFormat2(Position)
  implicit val propertyFileFormat = jsonFormat2(PropertyFile)
  implicit val nodeFormat = jsonFormat7(WebNode)
  implicit val visualPropertiesFormat = jsonFormat1(VisualProperties)
  implicit val workflowGraphFormat = jsonFormat7(WebWorkflowGraph)
  implicit val configEntryFormat = jsonFormat4(ConfigEntry)
  implicit val workflowConfigFormat = jsonFormat1(WorkflowConfig)
  implicit val versionListFormat = jsonFormat1(VersionList)
  implicit val oozieJobIdFormat = jsonFormat1(OozieJobId)
  implicit val oozieActionFormat = jsonFormat12(OozieAction)
  implicit val oozieCoordinatorJobFormat = jsonFormat15(CoordinatorJob)
  implicit val oozieWorkflowJobFormat: JsonFormat[WorkflowJob] = lazyFormat (
    jsonFormat (
      WorkflowJob,
      "id",
      "appName",
      "appPath",
      "user",
      "status",
      "createdTime",
      "startTime",
      "endTime",
      "run",
      "actions",
      "parentId",
      "externalId",
      "subJobs",
      "runningTime"
    )
  )

  implicit val oozieJobsFormat = jsonFormat2(OozieJobs)
  implicit val deployByPathRequestFormat = jsonFormat4(DeployByPathRequest)
  implicit val deployByEnvRequestFormat = jsonFormat4(DeployByEnvRequest)
  implicit val deploymentErrorFormat = jsonFormat1(DeploymentError)
  implicit val deploymentResultFormat = jsonFormat2(DeploymentResult)
  implicit val nodeTemplateContentFormat = jsonFormat1(NodeTemplateContent)
  implicit val existenceCheckResultFormat = jsonFormat2(ExistenceCheckResult)
  implicit val connectionRestrictionFormat = jsonFormat5(ConnectionRestriction)
  implicit val nodeTypeFormat = jsonFormat3(NodeType)
  implicit val typeMetadataFormat = jsonFormat5(TypeMetadata)
  implicit val subtypePropertyFormat = jsonFormat4(NodeProperty)
  implicit val subtypeFormat = jsonFormat2(NodeSubtype)
  implicit val subtypeMetadataFormat = jsonFormat1(SubtypeMetadata)
  implicit val workflowTemplatesFormat = jsonFormat1(WorkflowTemplates)
  implicit val createWorkflowTemplateRequestFormat = jsonFormat7(CreateWorkflowTemplateRequest)
  implicit val updateWorkflowTemplateRequestFormat = jsonFormat4(UpdateWorkflowTemplateRequest)
  implicit val createdWorkflowTemplateFormat = jsonFormat1(CreatedWorkflowTemplate)
  implicit val nodeTemplatesFormat = jsonFormat1(NodeTemplates)
  implicit val webNodeTemplateFormat = jsonFormat2(WebNodeTemplate)
  implicit val logFormat = jsonFormat1(OozieLog)
  implicit val jobLogTracesFormat = jsonFormat3(JobLogTraces)
  implicit val jobLogFormat = jsonFormat2(JobLog)
  implicit val jobLogListFormat = jsonFormat1(JobLogList)
  implicit val mustachePropertyFormat = jsonFormat2(MustacheProperty)
  implicit val mustachePropertiesFormat = jsonFormat1(MustacheProperties)
  implicit val oozieComponentFormat = jsonFormat5(OozieComponent)
  implicit val oozieDeploymentFormat = jsonFormat7(OozieDeployment)
  implicit val oozieDeploymentsFormat = jsonFormat1(OozieDeployments)
  implicit val ooziejobStatistics = jsonFormat4(JobStatistics)
  implicit val oozieRuntimeStatistics = jsonFormat2(OozieRuntimeStatistics)
  implicit val oozieDeploymentUpdateFormat = jsonFormat1(OozieDeploymentUpdate)

  override val marshalFileContent: PartialFunction[ParsedContent, JsValue] = {
    case o: WebWorkflowGraph => workflowGraphFormat.write(o)
    case o: WorkflowConfig => workflowConfigFormat.write(o)
    case o: NodeTemplateContent => nodeTemplateContentFormat.write(o)
    case EmptyParseContent => JsObject()
    case other => throw new ServerError(s"not supported: $other")
  }

  implicit object oozieJobFormat extends RootJsonFormat[OozieJob] {
    def write(x: OozieJob) = x match {
      case job: WorkflowJob => oozieWorkflowJobFormat.write(job)
      case job: CoordinatorJob => oozieCoordinatorJobFormat.write(job)
    }

    def read(value: JsValue) = throw new NotSupportedException
  }

  override val fileContentParsers: List[JsValue => ParsedContent] =
    List (
      _.convertTo[WebWorkflowGraph],
      _.convertTo[WorkflowConfig]
    )
}
