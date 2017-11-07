package com.directv.hw.persistence.dao

import java.nio.file.{Files, Paths}

import com.directv.hw.core.access.SrvUser
import com.directv.hw.core.settings.{UserSettings, UserState}
import com.directv.hw.hadoop.access.{KeyFile, KeyTypes}
import org.scalatest.{FlatSpec, Matchers}

class SettingsDaoSpec extends FlatSpec with Matchers with H2Test {

  private val keyPath = Paths.get(System.getProperty("user.dir")).resolve("target").resolve("test-keys")
  Files.createDirectories(keyPath)

  private val settingsDao = new SettingsDaoImpl(driver, db)
  private val keyDao = new KeyStoreDaoImpl(driver, db, keyPath.toString)
  private val userDao = new ServiceUserDaoImpl(driver, db)

  "dao" should "CRUD user state" in {

    db.withSession(implicit session => {

      keyTable.create
      userTable.create
      userStateTable.create

      val user = "test"
      val content = "test_content"

      settingsDao.getUserState(user) shouldBe None
      settingsDao.saveUserState(UserState(user, content))
      settingsDao.getUserState(user).get.state should be(content)
      settingsDao.deleteUserState(user)
      settingsDao.getUserState(user) shouldBe None
    })
  }

  "dao" should "CRUD user settings" in {

    db.withSession(implicit session => {

      keyTable.create
      userTable.create
      userSettingsTable.create

      val user = "test"
      val content = "test_content"

      // save
      settingsDao.getUserSettings(user) shouldBe None

      val tmpKey = Files.createTempFile(keyPath, "", ".leytab")
      val keyId = keyDao.addKey(KeyFile(None, KeyTypes.keyTab, "test_key"), Files.newInputStream(tmpKey))
      val userId = userDao.addUser(SrvUser(None, "test_user", keyId = Some(keyId)))

      settingsDao.saveUserSettings(UserSettings(user, content, Some(userId), None))
      val savedUser = settingsDao.getUserSettings(user).get
      savedUser.settings should be(content)
      savedUser.hdfsUserId should be(Some(userId))
      savedUser.oozieUserId should be(None)

      // delete
      settingsDao.deleteUserSettings(user)
      settingsDao.getUserSettings(user) shouldBe None
    })
  }
}
