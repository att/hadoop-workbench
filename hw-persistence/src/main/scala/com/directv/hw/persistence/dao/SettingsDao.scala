package com.directv.hw.persistence.dao

import com.directv.hw.core.settings.{UserSettings, UserState}
import com.directv.hw.persistence.entity._
import com.typesafe.scalalogging.LazyLogging

import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend._

trait SettingsDao {
  def getUserState(user: String): Option[UserState]
  def saveUserState(userState: UserState): Unit
  def deleteUserState(user: String): Unit

  def getUserSettings(user: String): Option[UserSettings]
  def saveUserSettings(userSettings: UserSettings): Unit
  def deleteUserSettings(user: String): Unit
}

class SettingsDaoImpl(driver: JdbcProfile, db: Database) extends SettingsDao with LazyLogging {

  import driver.simple._

  private val stateTable = new UserStateTable(driver)
  private val settingsTable = new UserSettingsTable(driver)

  override def getUserState(user: String): Option[UserState] = {
    db.withSession { implicit session =>
      stateTable.query.filter(_.user === user).firstOption
    }
  }

  override def deleteUserState(user: String): Unit = {
    db.withSession { implicit session =>
      val query = stateTable.query.filter(_.user === user)
      stateTable.delete(query)
    }
  }

  override def saveUserState(userState: UserState): Unit = {
    db.withSession { implicit session =>
      stateTable.query.insertOrUpdate(userState)
    }
  }

  override def getUserSettings(user: String): Option[UserSettings] = {
    db.withSession { implicit session =>
      settingsTable.query.filter(_.user === user).firstOption
    }
  }

  override def deleteUserSettings(user: String): Unit = {
    db.withSession { implicit session =>
      val query = settingsTable.query.filter(_.user === user)
      settingsTable.delete(query)
    }
  }

  override def saveUserSettings(userSettings: UserSettings): Unit = {
    db.withSession { implicit session =>
      settingsTable.query.insertOrUpdate(userSettings)
    }
  }
}
