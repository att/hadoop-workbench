package com.directv.hw.hadoop.template.injest.oozie.model

import com.directv.hw.hadoop.template.model.{Template, ComponentInfo}

case class OozieTemplate(workflowName: String, renderedWorkflowName: String, workflowVersion: String, info: ComponentInfo) extends Template