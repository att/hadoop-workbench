package com.directv.hw.hadoop.oozie.model

case class WorkflowInfo(name: String, version: String, renderedName: String, componentVersion: Option[String] = None)

case class AppInfo(name: String, version: String, renderedName: Option[String] = None)

case class OozieComponent(id: Int,
                          name: String,
                          description: Option[String],
                          version: String,
                          tenantId: Int)

case class OozieComponentInfo(name: String,
                              description: Option[String],
                              version: String,
                              team: Option[String])

case class OozieDeployment(platformId: Int,
                           clusterId: String,
                           path: String,
                           name: String,
                           renderedName: String,
                           version: String,
                           component: Option[OozieComponent])

case class OozieDeploymentUpdate(team: Option[String])

case class OozieDeploymentInfo(platformId: Int,
                               clusterId: String,
                               path: String,
                               name: String,
                               version: String,
                               componentId: Option[Int],
                               env: Option[String],
                               team: Option[String])

case class OozieDeployments(components: List[OozieDeployment])

case class CreateWorkflowTemplateRequest(templateId: Option[Int],
                                         tenantId: Int,
                                         name: String,
                                         version: String,
                                         workflowName: String,
                                         workflowVersion: String,
                                         description: Option[String])

case class ExistenceCheckResult(exists: String, description: Option[String] = None)
case class DeploymentError(message: String)
case class DeploymentResult(path: String, errors: List[DeploymentError])



