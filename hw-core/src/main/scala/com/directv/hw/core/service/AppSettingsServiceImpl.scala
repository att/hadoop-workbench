package com.directv.hw.core.service

import com.directv.hw.core.settings.MenuSettings
import com.directv.hw.persistence.dao.{SessionDao, UserRolesDao}
import scaldi.{Injectable, Injector}

class AppSettingsServiceImpl(implicit injector: Injector) extends AppSettingsService with Injectable {
  private val appConf = inject[AppConf]
  private val userRolesDao = inject[UserRolesDao]
  private val sessionDao = inject[SessionDao]

  override def getMenuSettings: MenuSettings = {
    val disabledItems = appConf.menuDisabled.split(",").map(_.trim).filterNot(_.isEmpty)
    MenuSettings(disabledItems.toList)
  }

  override def getUsersWithRoles: Map[String, List[String]] = {
    userRolesDao.find.foldLeft(Map.empty[String, List[String]]) { (map, record) =>
      val roles = map.getOrElse(record.user, List.empty[String])
      map + (record.user -> (record.role :: roles))
    }
  }

  override def saveUsersWithRoles(users: Map[String, List[String]]): Unit = {
    userRolesDao.delete()
    users.foreach { case (user, roles) =>
      userRolesDao.save(user, roles)
    }
  }

  override def getUsers: List[String] = {
    (userRolesDao.find.map(_.user) ++ sessionDao.getUsers).distinct
  }

  override def getUserRoles: List[String] = {
    userRolesDao.find.map(_.role).distinct
  }
}
