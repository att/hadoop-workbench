package com.directv.hw.hadoop.oozie.service

import com.directv.hw.hadoop.oozie.model.{WebWorkflowGraph, WorkflowGraph}

trait WorkflowWebConverter {
  def toWebModel(graph: WorkflowGraph,
                 renderedName: Option[String],
                 file: String,
                 persistence: Option[SimpleWorkflowPersistence]): WebWorkflowGraph

  def toServiceModel(graph: WebWorkflowGraph, file: String, persistence: Option[SimpleWorkflowPersistence]): WorkflowGraph
}
