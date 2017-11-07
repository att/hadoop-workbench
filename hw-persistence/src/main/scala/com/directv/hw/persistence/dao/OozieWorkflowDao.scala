package com.directv.hw.persistence.dao

import com.directv.hw.core.exception.ServerError
import com.directv.hw.hadoop.model.{ClusterPath, HdfsPath}
import com.directv.hw.hadoop.oozie.model.OozieDeploymentUpdate
import com.directv.hw.persistence.entity._
import com.typesafe.scalalogging.LazyLogging
import org.joda.time.DateTime

import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend._

trait OozieWorkflowDao {
  def getWorkflows: List[(OozieWorkflowEntity, Option[TemplateInfoEntity])]
  def getWorkflows(clusterPath: ClusterPath): List[(OozieWorkflowEntity, Option[TemplateInfoEntity])]
  def deleteWorkflows(clusterPath: ClusterPath, path: String)
  def deleteWorkflowsBefore(clusterPath: ClusterPath, date: DateTime)
  def getWorkflow(clusterPath: ClusterPath, appPath: String): OozieWorkflowEntity
  def updateWorkflow(hdfsPath: HdfsPath, update: OozieDeploymentUpdate): Unit
  def findWorkflow(clusterPath: ClusterPath, appPath: String): Option[OozieWorkflowEntity]
  def saveWorkflow(workflow: OozieWorkflowEntity)
  def deleteWorkflow(clusterPath: ClusterPath, path: String)
  def deleteWorkflows(clusterPath: ClusterPath)
  def deleteAll()
}

class OozieWorkflowDaoImpl(driver: JdbcProfile, db: Database) extends OozieWorkflowDao with LazyLogging {

  private val workflowTable = new OozieWorkflowTable(driver)
  import workflowTable._
  import workflowTable.driver.simple._

  private val templateTable = new TemplateInfoTable(driver)

  override def getWorkflows(clusterPath: ClusterPath): List[(OozieWorkflowEntity, Option[TemplateInfoEntity])] = {
    db.withSession { implicit session =>
      val clusterDeployments = workflowTable.query.filter { w =>
        w.platformId === clusterPath.platformId && w.clusterId === clusterPath.clusterId
      }

      val components = templateTable.query

      // wait for slick upgrade to use left join
      clusterDeployments.list.map { deployment =>
        (deployment, components.filter(_.id === deployment.componentId).firstOption)
      }
    }
  }

  override def updateWorkflow(hdfsPath: HdfsPath, update: OozieDeploymentUpdate): Unit = {
    db.withSession { implicit session =>
      workflowTable.query.filter { w =>
        w.platformId === hdfsPath.platformId &&
          w.clusterId === hdfsPath.clusterId &&
          w.path === hdfsPath.path
      }.map(_.team).update(update.team)
    }
  }

  def findWorkflow(clusterPath: ClusterPath, appPath: String): Option[OozieWorkflowEntity] = {
    db.withSession { implicit session =>
      filteringWorkflowQuery(clusterPath, appPath).firstOption
    }
  }

  def getWorkflow(clusterPath: ClusterPath, appPath: String): OozieWorkflowEntity = {
    db.withSession { implicit session =>
      filteringWorkflowQuery(clusterPath, appPath).firstOption
        .getOrElse(throw new ServerError(s"No workflow found - $clusterPath and appPath - $appPath"))
    }
  }

  private def filteringWorkflowQuery(clusterPath: ClusterPath, path: String) = {
    workflowTable.query.filter { w =>
      w.platformId === clusterPath.platformId && w.clusterId === clusterPath.clusterId && w.path === path
    }
  }

  override def saveWorkflow(workflow: OozieWorkflowEntity): Unit = {
    db.withSession { implicit session =>
      workflowTable.query.insertOrUpdate(workflow)
    }
  }

  override def deleteWorkflows(clusterPath: ClusterPath, path: String): Unit = {
    db.withSession { implicit session =>
      workflowTable.delete { workflowTable.query.filter { w =>
        w.platformId === clusterPath.platformId && w.clusterId === clusterPath.clusterId && (w.path startsWith path)
      }}
    }
  }

  override def deleteWorkflowsBefore(clusterPath: ClusterPath, date: DateTime): Unit = {
    db.withSession { implicit session =>
      workflowTable.query.filter { w =>
        w.platformId === clusterPath.platformId &&
          w.clusterId === clusterPath.clusterId &&
          w.cached < date
      }.delete
    }
  }

  override def deleteWorkflow(clusterPath: ClusterPath, path: String): Unit = {
    db.withSession { implicit session =>
      workflowTable.delete { workflowTable.query.filter { w =>
        w.platformId === clusterPath.platformId && w.clusterId === clusterPath.clusterId && w.path === path
      }}
    }
  }

  override def deleteWorkflows(clusterPath: ClusterPath): Unit = {
    db.withSession { implicit session =>
      workflowTable.delete { workflowTable.query.filter { w =>
        w.platformId === clusterPath.platformId && w.clusterId === clusterPath.clusterId
      }}
    }
  }

  override def deleteAll(): Unit = {
    db.withSession { implicit session =>
      workflowTable.delete(workflowTable.query)
    }
  }

  override def getWorkflows: List[(OozieWorkflowEntity, Option[TemplateInfoEntity])] = {
    db.withSession { implicit session =>
      val deployments = workflowTable.query.list

      val components = templateTable.query

      // wait for slick upgrade to use left join
      deployments.map { deployment =>
        (deployment, components.filter(_.id === deployment.componentId).firstOption)
      }
    }
  }
}
