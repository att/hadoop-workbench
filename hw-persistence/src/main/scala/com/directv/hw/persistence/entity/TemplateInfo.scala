package com.directv.hw.persistence.entity

import com.directv.hw.core.exception.ServerError
import org.joda.time.DateTime

import scala.language.existentials
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

case class TemplateInfoEntity(id: Option[Int],
                              tenantId: Int,
                              `type`: String,
                              name: String,
                              version: String,
                              description: Option[String],
                              team: Option[String])

class TemplateInfoTable(val driver: JdbcProfile) {

  import driver.simple._

  class TemplateBaseMapping(tag: Tag) extends Table[TemplateInfoEntity](tag, "TEMPLATE") {
    def id = column[Int]("ID", O.PrimaryKey, O.AutoInc)

    def tenantId = column[Int]("TENANT_ID")
    def tenant = foreignKey("TEMPLATE_TENANT_FK", tenantId, new TenantTable(driver).query)(_.id,
      onDelete=ForeignKeyAction.Restrict)

    def `type` = column[String]("TYPE", O.NotNull)
    def name = column[String]("NAME", O.NotNull)
    def version = column[String]("VERSION", O.NotNull)
    def description = column[Option[String]]("DESCRIPTION")
    def team = column[Option[String]]("TEAM")

    def * = (id.?, tenantId, `type`, name, version, description, team) <> (TemplateInfoEntity.tupled, TemplateInfoEntity.unapply)
  }

  implicit val dateMapper = MappedColumnType.base[DateTime, java.sql.Timestamp](
    dateTime => new java.sql.Timestamp(dateTime.getMillis),
    sqlTimestamp => new DateTime(sqlTimestamp.getTime)
  )

  val query = TableQuery[TemplateBaseMapping]

  def getById(id: Int)(implicit session: JdbcBackend.Session): TemplateInfoEntity = {
    query.filter(_.id === id).firstOption.getOrElse(throw new ServerError(s"Template with id [$id] not found"))
  }

  def insert(info: TemplateInfoEntity)(implicit session: JdbcBackend.Session) = {
    query.returning(query.map(_.id)).insert(info)
  }

  def update(info: TemplateInfoEntity)(implicit session: JdbcBackend.Session) = {
    query.filter(_.id === info.id.get).update(info)
  }

  def delete(id: Int)(implicit session: JdbcBackend.Session) = {
    query.filter(_.id === id).delete
  }

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)

}