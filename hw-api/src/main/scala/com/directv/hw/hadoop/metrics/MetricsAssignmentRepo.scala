package com.directv.hw.hadoop.metrics

import com.directv.hw.hadoop.model.ModulePath

trait MetricsAssignmentRepo {
  def getAssignments(componentPath: ModulePath): List[MetricsAssignment]
  def deleteAssignment(id: Int): Unit
  def addAssignment(path: ModulePath, assignment: MetricsAssignment): Int
}
