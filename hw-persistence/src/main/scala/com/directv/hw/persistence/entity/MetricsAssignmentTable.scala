package com.directv.hw.persistence.entity

import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

case class MetricsAssignmentEntity(id: Option[Int],
                                   componentPath: String,
                                   nodeId: String,
                                   title: String,
                                   value: String,
                                   color: Option[String] = None)


class MetricsAssignmentTable(val driver: JdbcProfile) {
  import driver.simple._

  class MetricsAssignmentMapping(tag: Tag) extends Table[MetricsAssignmentEntity](tag, "METRICS_ASSIGNMENT") {
    def id = column[Int]("ID", O.PrimaryKey, O.AutoInc)
    def componentPath = column[String]("COMPONENT_PATH")
    def nodeId = column[String]("NODE_ID")
    def title = column[String]("TITLE")
    def value = column[String]("VALUE")
    def color = column[String]("COLOR")

    def * = (id.?, componentPath, nodeId, title, value, color.?) <>
      (MetricsAssignmentEntity.tupled, MetricsAssignmentEntity.unapply)
  }

  val query = TableQuery[MetricsAssignmentMapping]
  type MetricsAssignmentQuery = Query[MetricsAssignmentMapping, MetricsAssignmentMapping#TableElementType, Seq]

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)
  def delete(filter: MetricsAssignmentQuery)(implicit session: JdbcBackend.Session) = filter.delete
}
