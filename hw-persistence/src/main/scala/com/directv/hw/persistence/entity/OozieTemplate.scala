package com.directv.hw.persistence.entity

import scala.language.existentials
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

case class OozieTemplateEntity(id: Option[Int], schemaName: String, renderedSchemaName: String, schemaVersion: String)

class OozieTemplateTable(val driver: JdbcProfile) {

  import driver.simple._

  class OozieTenantMapping(tag: Tag) extends Table[OozieTemplateEntity](tag, "OOZIE_TEMPLATE") {
    def id = column[Int]("ID", O.PrimaryKey)

    def name = column[String]("SCHEMA_NAME", O.NotNull)
    def renderedName = column[String]("RENDERED_SCHEMA_NAME", O.NotNull)
    def version = column[String]("SCHEMA_VERSION", O.NotNull)

    def base = foreignKey("OOZIE_TEMPLATE_BASE_FK", id, new TemplateInfoTable(driver).query)(_.id, onDelete = ForeignKeyAction.Cascade)

    def * = (id.?, name, renderedName, version) <> (OozieTemplateEntity.tupled, OozieTemplateEntity.unapply)
  }

  val query = TableQuery[OozieTenantMapping]

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)
}

