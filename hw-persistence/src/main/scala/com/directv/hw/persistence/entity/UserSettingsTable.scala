package com.directv.hw.persistence.entity

import com.directv.hw.core.settings.UserSettings

import scala.language.existentials
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

class UserSettingsTable(val driver: JdbcProfile) {
  import driver.simple._

  class UserSettingsMapping(tag: Tag) extends Table[UserSettings](tag, "USER_SETTINGS") {
    def user = column[String]("USER", O.PrimaryKey)
    def settings = column[String]("SETTINGS")
    def localUserAsService = column[Boolean]("LOCAL_USER_AS_SERVICE", O.NotNull)
    def hdfsUserId = column[Int]("HDFS_USER_ID", O.Nullable)
    def oozieUserId = column[Int]("OOZIE_USER_ID", O.Nullable)
    def hdfsUser = foreignKey("USER_SETTINGS_HDFS_USER_FK", hdfsUserId, new ServiceUserTable(driver).query)(_.id)
    def oozieServiceUser = foreignKey("USER_SETTINGS_OOZIE_USER_FK", oozieUserId, new ServiceUserTable(driver).query)(_.id)

    def * = (user, settings, hdfsUserId.?, oozieUserId.?, localUserAsService) <>(UserSettings.tupled, UserSettings.unapply)
  }

  val query = TableQuery[UserSettingsMapping]
  type UserStateQuery = Query[UserSettingsMapping, UserSettingsMapping#TableElementType, Seq]

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)
  def delete(filter: UserStateQuery)(implicit session: JdbcBackend.Session) = filter.delete
}
