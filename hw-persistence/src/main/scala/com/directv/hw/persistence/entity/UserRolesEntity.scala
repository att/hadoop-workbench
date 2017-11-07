package com.directv.hw.persistence.entity

import scala.slick.driver.JdbcDriver

case class UserRolesEntity(user: String, role: String)

class UserRolesTable(val driver: JdbcDriver) {

  import driver.simple._

  class UserRolesMapping(tag: Tag) extends Table[UserRolesEntity](tag, "USER_ROLES") {
    def user = column[String]("USER", O.NotNull)
    def role = column[String]("ROLE", O.NotNull)

    def pk = primaryKey("USER_ROLES_PK", (user, role))

    def * = (user, role) <> (UserRolesEntity.tupled, UserRolesEntity.unapply)
  }

  val query = TableQuery[UserRolesMapping]
}
