package com.directv.hw.persistence.entity

import org.joda.time.DateTime

import scala.slick.driver.JdbcDriver
import scala.slick.jdbc.JdbcBackend

case class UserSessionEntity(username: String, token: String, timestamp: DateTime = DateTime.now())

class UserSessionTable(val driver: JdbcDriver) {

  import driver.simple._

  class SessionMapping(tag: Tag) extends Table[UserSessionEntity](tag, "SESSION") {
    def username = column[String]("USER_NAME")
    def token = column[String]("TOKEN")
    def timestamp = column[DateTime]("TIMESTAMP")(dateMapper)

    def pk = primaryKey("SESSION_PK", (username, token))

    def * = (username, token, timestamp) <> (UserSessionEntity.tupled, UserSessionEntity.unapply)

    implicit val dateMapper = MappedColumnType.base[DateTime, java.sql.Timestamp](
      dateTime => new java.sql.Timestamp(dateTime.getMillis),
      sqlTimestamp => new DateTime(sqlTimestamp.getTime))
  }

  val query = TableQuery[SessionMapping]
  type UserSessionQuery = Query[SessionMapping, SessionMapping#TableElementType, Seq]

  def store(authSession: UserSessionEntity)(implicit session: JdbcBackend.Session) = query.insertOrUpdate(authSession)

  def deleteForUser(username: String)(implicit session: JdbcBackend.Session) = query.filter(_.username === username).delete

  def deleteToken(token: String)(implicit session: JdbcBackend.Session) = query.filter(_.token === token).delete

  def delete(query: UserSessionQuery)(implicit session: JdbcBackend.Session) = query.delete

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)
}
