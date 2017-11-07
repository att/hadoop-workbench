package com.directv.hw.persistence.entity

import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

case class TenantEntity(id: Option[Int], name: String, version: String, description: Option[String])

class TenantTable(val driver: JdbcProfile) {

  import driver.simple._

  class TenantBaseMapping(tag: Tag) extends Table[TenantEntity](tag, "TENANT") {
    def id = column[Int]("ID", O.PrimaryKey, O.AutoInc)

    def name = column[String]("NAME", O.NotNull)
    def version = column[String]("VERSION", O.NotNull)
    def description = column[Option[String]]("DESCRIPTION")
    
    def idx = index("TENANT_NAME_VERSION_UK", (name, version), unique = true)

    def * = (id.?, name, version, description) <> (TenantEntity.tupled, TenantEntity.unapply)
  }

  val query = TableQuery[TenantBaseMapping]

  def delete(id: Int)(implicit session: JdbcBackend.Session) = {
    query.filter(_.id === id).delete
  }

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)

}