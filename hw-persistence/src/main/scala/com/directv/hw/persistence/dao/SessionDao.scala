package com.directv.hw.persistence.dao

import com.directv.hw.persistence.entity.{UserSessionEntity, UserSessionTable}
import com.typesafe.scalalogging.LazyLogging
import org.joda.time.DateTime

import scala.slick.driver.{JdbcDriver, JdbcProfile}
import scala.slick.jdbc.JdbcBackend.Database


trait SessionDao {
  def findSession(token: String): Option[UserSessionEntity]
  def storeSession(username: String, token: String): Unit
  def deleteSession(token: String): Unit
  def removeOutdated(user: String, timoutSec: Long): Unit
  def getUsers: List[String]
}

class SessionDaoImpl(driver: JdbcDriver, db: Database) extends SessionDao with LazyLogging {

  import driver.simple._
  object PortableJodaSupport extends com.github.tototoshi.slick.GenericJodaSupport(driver)
  import PortableJodaSupport._

  val sessionsTable = new UserSessionTable(driver)

  def findSession(token: String): Option[UserSessionEntity] = {
    db.withSession { implicit session =>
      val query = for {
        s <- sessionsTable.query if s.token === token
      } yield s

      query.firstOption
    }
  }

  def delete(username:String) = {
    db.withSession{implicit session => sessionsTable.deleteForUser(username)}
  }

  def storeSession(user: String, token: String) = {
    db.withSession { implicit session =>
      sessionsTable.query.insertOrUpdate(UserSessionEntity(user, token))
    }
  }

  override def deleteSession(token: String) = {
    db.withSession { implicit session =>
      sessionsTable.deleteToken(token)
    }
  }

  override def removeOutdated(user: String, timeoutSec: Long): Unit = {
    db.withSession { implicit session =>

      val now = DateTime.now().plus(timeoutSec * 1000)

      val query = for {
        s <- sessionsTable.query if s.timestamp > now
      } yield s

      sessionsTable.delete(query)
    }
  }

  override def getUsers: List[String] = {
    db.withSession { implicit session =>
      sessionsTable.query.map(_.username).list.distinct
    }
  }
}