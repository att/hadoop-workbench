package com.directv.hw.persistence.entity

import scala.language.postfixOps
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

case class ProvisionEntity(id: Option[Int], stateId: String, `type`: String)

class ProvisionTable(val driver: JdbcProfile) {
  import driver.simple._

  lazy val platformTable = new PlatformTable(driver)

  class ProvisionMapping(tag: Tag) extends Table[ProvisionEntity](tag, "Provision") {
    def id = column[Int]("ID", O.NotNull, O.PrimaryKey, O.AutoInc)
    def stateId = column[String]("STATE_ID", O.NotNull)
    def `type` = column[String]("TYPE", O.NotNull)

    def * = (id?, stateId, `type`) <> (ProvisionEntity.tupled, ProvisionEntity.unapply)
  }

  val query = TableQuery[ProvisionMapping]

  def insert(entity: ProvisionEntity)(implicit session: JdbcBackend.Session) = {
    query returning query.map(_.id) insert entity
  }
  
  def delete(id: Int)(implicit session: JdbcBackend.Session) = {
    query filter (p => p.id === id) delete
  }

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)
}
