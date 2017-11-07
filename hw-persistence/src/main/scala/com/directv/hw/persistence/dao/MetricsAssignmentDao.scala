package com.directv.hw.persistence.dao

import com.directv.hw.persistence.entity._
import com.typesafe.scalalogging.LazyLogging

import scala.language.postfixOps
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend._

trait MetricsAssignmentDao {
  def getAssignments(componentPath: String): List[MetricsAssignmentEntity]
  def addAssignment(metricsAssignmentEntity: MetricsAssignmentEntity): Int
  def deleteAssignment(id: Int): Unit
}

class MetricsAssignmentDaoImpl(driver: JdbcProfile, db: Database) extends MetricsAssignmentDao with LazyLogging {

  import driver.simple._

  private val table = new MetricsAssignmentTable(driver)
  private val query = table.query

  override def getAssignments(componentPath: String): List[MetricsAssignmentEntity] = {
    db.withSession { implicit session =>
      query.filter(_.componentPath === componentPath).list
    }
  }

  override def addAssignment(assignment: MetricsAssignmentEntity): Int = {
    db.withSession { implicit session =>
      query returning query.map(_.id) += assignment
    }
  }

  override def deleteAssignment(id: Int): Unit = {
    db.withSession { implicit session =>
      table.delete(query.filter(_.id === id))
    }
  }
}