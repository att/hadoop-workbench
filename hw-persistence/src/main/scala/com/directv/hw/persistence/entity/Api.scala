package com.directv.hw.persistence.entity

import scala.language.existentials
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

case class ApiEntity(id: Option[Int],
                     `type`: String,
                     version: Option[String],
                     host: String,
                     port: Int,
                     protocol: String,
                     user: Option[String] = None,
                     password: Option[String] = None,
                     keyId: Option[Int] = None)

class ApiTable(val driver: JdbcProfile) {
  import driver.simple._

  class ApiMapping(tag: Tag) extends Table[ApiEntity](tag, "API") {
    def id = column[Int]("ID", O.PrimaryKey, O.AutoInc)
    def `type` = column[String]("TYPE", O.NotNull)
    def version = column[String]("VERSION", O.Nullable)
    def host = column[String]("HOST", O.NotNull)
    def port = column[Int]("PORT", O.NotNull)
    def protocol = column[String]("PROTOCOL", O.NotNull)
    def userName = column[String]("USER_NAME", O.Nullable)
    def password = column[String]("PASSWORD", O.Nullable)
    def keyId = column[Int]("KEY_ID", O.Nullable)

    def key = foreignKey("API_KEY_FK", keyId, new KeyStoreTable(driver).query)(_.id)

    def * = (id.?, `type`, version.?, host, port, protocol, userName.?, password.?, keyId.?) <>(ApiEntity.tupled, ApiEntity.unapply)
  }

  val query = TableQuery[ApiMapping]

  def insert(api: ApiEntity)(implicit session: JdbcBackend.Session) = {
    query returning query.map(_.id) insert api
  }

  def delete(id: Int)(implicit session: JdbcBackend.Session) = query.filter(_.id === id).delete

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)
}
