package com.directv.hw.persistence.dao

import org.scalatest.{Matchers, FlatSpec}

object SessionDaoSpec {
  val username = "username1"
  val token1 = "token1"
  val token2 = "token2"
}

class SessionDaoSpec extends FlatSpec with Matchers with H2Test {

  import SessionDaoSpec._

  val sessionDao = new SessionDaoImpl(driver, db)


  "db" should "return inserted authSession" in {
    db.withSession(implicit session => {
      sessions.create

      sessionDao.storeSession(username, token1)

      val authSession1 = sessionDao.findSession(token1).get
      (authSession1.username, authSession1.token) should be(username, token1)

      sessionDao.storeSession(username, token2)

      sessionDao.findSession(token1) shouldBe defined

      val authSession2 = sessionDao.findSession(token2).get
      (authSession2.username, authSession2.token) should be(username, token2)
    })
  }
}
