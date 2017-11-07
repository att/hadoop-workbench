package com.directv.hw.core.service

import com.directv.hw.core.settings.MenuSettings

trait AppSettingsService {
  def getMenuSettings: MenuSettings
  def getUsersWithRoles: Map[String, List[String]]
  def saveUsersWithRoles(users: Map[String, List[String]]): Unit
  def getUsers: List[String]
  def getUserRoles: List[String]
}
