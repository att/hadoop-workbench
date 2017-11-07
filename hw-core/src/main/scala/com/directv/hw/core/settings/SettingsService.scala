package com.directv.hw.core.settings

import com.directv.hw.persistence.dao.SettingsDao

trait SettingsService {
  def getUserSettings(user: String): Option[UserSettings]
  def saveUserSettings(userSettings: UserSettings): Unit
  def deleteUserSettings(user: String): Unit

  def getUserState(user: String): Option[UserState]
  def saveUserState(userState: UserState): Unit
  def deleteUserState(user: String): Unit
}

class SettingsServiceImpl(settingsDao: SettingsDao) extends SettingsService {

  override def getUserState(user: String): Option[UserState] = {
    settingsDao.getUserState(user)
  }

  override def saveUserState(userState: UserState): Unit = {
    settingsDao.saveUserState(userState)
  }

  override def deleteUserState(user: String): Unit = {
    settingsDao.deleteUserState(user)
  }

  override def getUserSettings(user: String): Option[UserSettings] = {
    settingsDao.getUserSettings(user)
  }

  override def saveUserSettings(userSettings: UserSettings): Unit = {
    settingsDao.saveUserSettings(userSettings)
  }

  override def deleteUserSettings(user: String): Unit = {
    settingsDao.deleteUserSettings(user)
  }
}
