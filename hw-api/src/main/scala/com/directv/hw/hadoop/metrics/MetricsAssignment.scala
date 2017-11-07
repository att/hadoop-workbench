package com.directv.hw.hadoop.metrics

case class MetricsAssignment(id: Option[Int],
                             nodeId: String,
                             title: String,
                             value: String,
                             color: Option[String] = None)

case class MetricsAssignmentList(assignments: List[MetricsAssignment])