package com.directv.hw.hadoop.metrics

import com.directv.hw.hadoop.model.ModulePath
import com.directv.hw.persistence.dao.MetricsAssignmentDao
import com.directv.hw.persistence.entity.MetricsAssignmentEntity
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}

class MetricsAssignmentRepoImpl(implicit injector: Injector) extends MetricsAssignmentRepo with Injectable with LazyLogging {
  private val dao = inject[MetricsAssignmentDao]

  override def getAssignments(path: ModulePath): List[MetricsAssignment] = {
    dao.getAssignments(pathKey(path)).map(toModel)
  }

  override def deleteAssignment(id: Int): Unit = {
    dao.deleteAssignment(id)
  }

  override def addAssignment(path: ModulePath, assignment: MetricsAssignment): Int = {
    dao.addAssignment(toEntity(path, assignment))
  }

  private def toModel(entity: MetricsAssignmentEntity) = {
    MetricsAssignment(entity.id, entity.nodeId, entity.title, entity.value, entity.color)
  }

  private def toEntity(path: ModulePath, model: MetricsAssignment) = {
    MetricsAssignmentEntity(model.id, pathKey(path), model.nodeId, model.title, model.value, model.color)
  }

  private def pathKey(modulePath: ModulePath): String = {
    s"${modulePath.platformId}|${modulePath.clusterId}|${modulePath.serviceId}|${modulePath.moduleId}"
  }
}

