package com.directv.hw.persistence.entity

import com.directv.hw.core.settings.UserState

import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

class UserStateTable(val driver: JdbcProfile) {
  import driver.simple._

  class UserStateMapping(tag: Tag) extends Table[UserState](tag, "USER_STATE") {
    def user = column[String]("USER", O.PrimaryKey)
    def state = column[String]("STATE")

    def * = (user, state) <>(UserState.tupled, UserState.unapply)
  }

  val query = TableQuery[UserStateMapping]
  type UserStateQuery = Query[UserStateMapping, UserStateMapping#TableElementType, Seq]

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)
  def delete(filter: UserStateQuery)(implicit session: JdbcBackend.Session) = filter.delete
}
