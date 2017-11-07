package com.directv.hw.persistence.entity

import scala.language.existentials
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

case class FlumeTemplateEntity(id: Option[Int], agentName: String)

class FlumeTemplateTable(val driver: JdbcProfile) {

  import driver.simple._

  class FlumeTemplateMapping(tag: Tag) extends Table[FlumeTemplateEntity](tag, "FLUME_TEMPLATE") {
    def id = column[Int]("ID", O.PrimaryKey)
    def agentName = column[String]("AGENT_NAME")

    def base = foreignKey("FLUME_TEMPLATE_BASE_FK", id, new TemplateInfoTable(driver).query)(_.id, onDelete = ForeignKeyAction.Cascade)

    def * = (id.?, agentName) <> (FlumeTemplateEntity.tupled, FlumeTemplateEntity.unapply)
  }

  val query = TableQuery[FlumeTemplateMapping]

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)
}