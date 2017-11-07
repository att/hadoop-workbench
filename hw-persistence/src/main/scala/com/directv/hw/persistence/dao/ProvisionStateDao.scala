package com.directv.hw.persistence.dao

import com.directv.hw.persistence.entity._
import com.typesafe.scalalogging.LazyLogging

import scala.language.postfixOps
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend._

trait ProvisionStateDao {
  def addProvision(entity: ProvisionEntity): Int
  def remove(id: Int)
}

class ProvisionStateDaoImpl(driver: JdbcProfile, db: Database) extends ProvisionStateDao with LazyLogging {

  val table = new ProvisionTable(driver)
  val query = table.query

  def addProvision(entity: ProvisionEntity) = {
    db.withSession { implicit session =>
      table.insert(entity)
    }
  }

  def remove(id: Int) = {
    db.withSession { implicit session =>
      table.delete(id)
    }
  }
}
