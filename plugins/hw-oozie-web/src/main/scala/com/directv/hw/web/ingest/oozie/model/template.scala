package com.directv.hw.web.ingest.oozie.model

import com.directv.hw.hadoop.config.MustacheProperty
import com.directv.hw.hadoop.model.ModuleFile
import com.directv.hw.hadoop.template.injest.oozie.model.{OozieNodeTemplate, OozieTemplate}

case class WorkflowTemplates (workflowTemplates: List[OozieTemplate])


case class UpdateWorkflowTemplateRequest(name: String,
                                         version: String,
                                         description: Option[String],
                                         team: Option[String])

case class CreatedWorkflowTemplate(templateId: Int)

case class WebNodeTemplate(info: OozieNodeTemplate, files: List[ModuleFile])

case class NodeTemplates (nodeTemplates: List[OozieNodeTemplate])

case class MustacheProperties(properties: List[MustacheProperty])

