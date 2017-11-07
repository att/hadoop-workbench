package com.directv.hw.persistence.dao

import com.directv.hw.persistence.entity.{PropertyEntity, PropertyTable}
import com.typesafe.scalalogging.LazyLogging

import scala.language.postfixOps
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend._

trait PropertyDao {
  def findByPartialKey(partialKey: String): List[PropertyEntity]
  def getValue(key: String): String
  def saveValue(key: String, value: String)
  def delete(key: String)

  /**
   * Removes all records where key starts with provided value
   */
  def deleteByPartialKey(partialKey: String)
}

class PropertyDaoImpl(driver: JdbcProfile, db: Database) extends PropertyDao with LazyLogging {

  import driver.simple._

  val table = new PropertyTable(driver)
  val query = table.query

  override def findByPartialKey(key: String): List[PropertyEntity] = db.withSession { implicit session =>
    query filter(_.key startsWith  key) list
  }

  override def getValue(key: String): String = {
    db.withSession { implicit session =>
      query.filter(_.key === key).map(_.value).firstOption.orNull
    }
  }

  override def saveValue(key: String, value: String): Unit = {
    db.withSession { implicit session =>
      query.insertOrUpdate(PropertyEntity(key, value))
    }
  }

  override def delete(key: String) = {
    db.withSession { implicit session =>
      val filter = query.filter(_.key === key)
      table.delete(filter)
    }
  }

  override def deleteByPartialKey(key: String) = {
    db.withSession { implicit session =>
      val filter = query.filter(_.key startsWith  key)
      table.delete(filter)
    }
  }
}
