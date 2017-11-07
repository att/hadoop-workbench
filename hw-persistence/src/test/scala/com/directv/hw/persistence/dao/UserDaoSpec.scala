package com.directv.hw.persistence.dao

import java.nio.file.{Files, Paths}

import com.directv.hw.core.access.SrvUser
import com.directv.hw.hadoop.access.{KeyFile, KeyTypes}
import org.scalatest.{FlatSpec, Matchers}

class UserDaoSpec extends FlatSpec with Matchers with H2Test {

  private val keyPath = Paths.get(System.getProperty("user.dir")).resolve("target").resolve("test-keys")
  Files.createDirectories(keyPath)
  private val userDao = new ServiceUserDaoImpl(driver, db)
  private val keyDao = new KeyStoreDaoImpl(driver, db, keyPath.toString)

  "dao" should "CRUD user" in {

    db.withSession(implicit session => {

      keyTable.create
      userTable.create

      val tmpKey = Files.createTempFile(keyPath, "", ".leytab")
      val keyId = keyDao.addKey(KeyFile(None, KeyTypes.pem, "test.keytab"), Files.newInputStream(tmpKey))
      userDao.addUser(SrvUser(None, "user1", keyId = Some(keyId)))
      userDao.addUser(SrvUser(None, "user2"))

      val users = userDao.users(None, None, None)
      users should have size 2

      // filter by type test
      users.head.owner should not be defined
      users.head.keyId should be(Some(keyId))
      users(1).owner should not be defined
      users(1).keyId should not be defined

      // update test
      userDao.updateUser(SrvUser(users.head.id, "user22", None, None))
      val updatedUser = userDao.userById(users.head.id.get)
      updatedUser.name should be("user22")
      updatedUser.keyId should not be defined

      // delete test
      userDao.deleteUser(users.head.id.get)
      val secondUsers = userDao.users(None, None, None)
      secondUsers should have size 1
    })
  }

  "dao" should "return personal users" in {

    db.withSession(implicit session => {

      keyTable.create
      userTable.create

      userDao.addUser(SrvUser(None, "user1", Some("test")))
      userDao.addUser(SrvUser(None, "user2"))

      val users = userDao.users(None, None, owner =  Some("test"))
      users should have size 1
      users.head.owner shouldBe Some("test")
    })
  }
}
