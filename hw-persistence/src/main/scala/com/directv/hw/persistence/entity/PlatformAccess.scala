package com.directv.hw.persistence.entity

import scala.language.existentials
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

case class PlatformAccessEntity(id: Option[Int] = None,
                                port: Int = 22,
                                userName: Option[String] = None,
                                password: Option[String] = None,
                                keyFileId: Option[Int] = None,
                                pluginDirs: Option[String] = None)

class PlatformAccessTable(val driver: JdbcProfile) {

  import driver.simple._

  class PlatformAccessMapping(tag: Tag) extends Table[PlatformAccessEntity](tag, "PLATFORM_ACCESS") {
    def id = column[Int]("ID", O.PrimaryKey, O.AutoInc)
    def port = column[Int]("PORT")
    def userName = column[String]("USER_NAME", O.Nullable)
    def password = column[String]("PASSWORD", O.Nullable)
    def keyFileId = column[Int]("KEY_FILE_ID", O.Nullable)
    def pluginDirs = column[String]("PLUGIN_DIRS", O.Nullable)

    def platform = foreignKey("PLATFORM_ACCESS_PLATFORM_FK", id, new PlatformTable(driver).query)(_.id)
    def key = foreignKey("PLATFORM_ACCESS_KEY_FILE_FK", id, new KeyStoreTable(driver).query)(_.id)

    def * = (id.?, port, userName.?, password.?, keyFileId.?, pluginDirs.?) <> (PlatformAccessEntity.tupled, PlatformAccessEntity.unapply)
  }

  val query = TableQuery[PlatformAccessMapping]

  def delete(platformId: Int)(implicit session: JdbcBackend.Session) = {
    query.filter(_.id === platformId).delete(session)
  }

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)
}
