package com.directv.hw.persistence.dao

import com.directv.hw.persistence.entity.{UserRolesEntity, UserRolesTable}
import com.typesafe.scalalogging.LazyLogging
import scala.slick.driver.JdbcDriver
import scala.slick.jdbc.JdbcBackend.Database


trait UserRolesDao {
  def find: List[UserRolesEntity]
  def find(user: String): List[String]
  def save(user: String, roles: List[String]): Unit
  def save(user: String, role: String): Unit
  def delete(user: String): Unit
  def delete(): Unit
}

class UserRolesDaoImpl(driver: JdbcDriver, db: Database) extends UserRolesDao with LazyLogging {

  private val rolesTable = new UserRolesTable(driver)
  private val query = rolesTable.query

  import  rolesTable.driver.simple._

  def find(user: String): List[String] = {
    db.withSession { implicit session =>
      query.filter(_.user === user).map(_.role).list
    }
  }

  override def save(user: String, roles: List[String]): Unit = {
    db.withSession { implicit session =>
      roles.foreach { role =>
        query.insertOrUpdate(UserRolesEntity(user, role))
      }
    }
  }

  override def save(user: String, role: String): Unit = {
    db.withSession { implicit session =>
      query.insertOrUpdate(UserRolesEntity(user, role))
    }
  }

  override def delete(user: String): Unit = {
    db.withSession { implicit session =>
      query.filter(_.user === user).delete
    }
  }

  override def find: List[UserRolesEntity] = {
    db.withSession { implicit session =>
      query.list
    }
  }

  override def delete(): Unit = {
    db.withSession { implicit session =>
      query.delete
    }
  }
}