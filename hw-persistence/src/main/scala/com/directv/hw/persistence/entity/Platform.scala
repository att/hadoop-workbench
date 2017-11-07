package com.directv.hw.persistence.entity

import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

case class PlatformEntity(id: Option[Int],
                          `type`: String,
                          version: String,
                          description: String,
                          location: String,
                          apiId: Int)

class PlatformTable(val driver: JdbcProfile) {

  import driver.simple._

  lazy val apiTable = new ApiTable(driver)
  lazy val installationTable = new PlatformInstallationTable(driver)

  class PlatformMapping(tag: Tag) extends Table[PlatformEntity](tag, "PLATFORM") {
    def id = column[Int]("ID", O.PrimaryKey, O.AutoInc)
    def `type` = column[String]("TYPE", O.NotNull)
    def version = column[String]("VERSION", O.NotNull)
    def description = column[String]("DESCRIPTION", O.NotNull)
    def location = column[String]("LOCATION", O.NotNull)
    def apiId = column[Int]("API_ID", O.NotNull)
    def api = foreignKey("PLATFORM_API_FK", apiId, apiTable.query)(_.id, onDelete = ForeignKeyAction.Cascade)

    def * = (id.?, `type`, version, description, location, apiId) <> (PlatformEntity.tupled, PlatformEntity.unapply)
  }

  val query = TableQuery[PlatformMapping]

  def insert(platform: PlatformEntity)(implicit session: JdbcBackend.Session) = {
    query returning query.map(_.id) insert platform
  }

  def delete(platformId: Int)(implicit session: JdbcBackend.Session) = {
    val platformQuery = query.filter(_.id === platformId)
    val platforms = platformQuery.list
    platformQuery.delete(session)
    platforms foreach (p => apiTable.delete(p.apiId))
  }

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)
}
