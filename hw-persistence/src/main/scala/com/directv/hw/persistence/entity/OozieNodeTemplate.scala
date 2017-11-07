package com.directv.hw.persistence.entity

import scala.language.existentials
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

case class OozieNodeTemplateEntity(id: Option[Int], nodeType: String, version: String)

class OozieNodeTemplateTable(val driver: JdbcProfile) {

  import driver.simple._

  class OozieNodeTenantMapping(tag: Tag) extends Table[OozieNodeTemplateEntity](tag, "OOZIE_NODE_TEMPLATE") {
    def id = column[Int]("ID", O.PrimaryKey)

    def nodeType = column[String]("NODE_TYPE", O.NotNull)
    def version = column[String]("VERSION", O.NotNull)

    def base = foreignKey("OOZIE_NODE_TEMPLATE_BASE_FK", id, new TemplateInfoTable(driver).query)(_.id, onDelete = ForeignKeyAction.Cascade)

    def * = (id.?, nodeType, version) <> (OozieNodeTemplateEntity.tupled, OozieNodeTemplateEntity.unapply)
  }

  val query = TableQuery[OozieNodeTenantMapping]

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)
}

