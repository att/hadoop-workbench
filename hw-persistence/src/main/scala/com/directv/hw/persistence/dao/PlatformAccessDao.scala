package com.directv.hw.persistence.dao

import com.directv.hw.persistence.entity._
import com.typesafe.scalalogging.LazyLogging

import scala.language.postfixOps
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend._

trait PlatformAccessDao {
  def getPlatformAccess(platformId: Int): Option[PlatformAccessEntity]
  def addPlatformAccess(entity: PlatformAccessEntity): Int
  def savePlatformAccess(entity: PlatformAccessEntity)
  def deletePlatformAccess(platformId: Int)
}

class PlatformAccessDaoImpl(driver: JdbcProfile, db: Database) extends PlatformAccessDao with LazyLogging {

  import driver.simple._

  private val table = new PlatformAccessTable(driver)

  override def getPlatformAccess(platformId: Int): Option[PlatformAccessEntity] = {
    db.withSession { implicit session =>
      table.query filter (_.id === platformId) firstOption
    }
  }

  override def addPlatformAccess(entity: PlatformAccessEntity): Int = {
    db.withSession { implicit session =>
      table.query returning table.query.map(_.id) insert entity
    }
  }

  override def savePlatformAccess(entity: PlatformAccessEntity) = {
    db.withSession { implicit session =>
      table.query insertOrUpdate entity
    }
  }

  override def deletePlatformAccess(platformId: Int) = {
    db.withSession { implicit session =>
      table delete platformId
    }
  }

}
