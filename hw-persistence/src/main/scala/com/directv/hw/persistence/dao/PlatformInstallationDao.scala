package com.directv.hw.persistence.dao

import com.directv.hw.persistence.entity._
import com.typesafe.scalalogging.LazyLogging

import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend._

trait PlatformInstallationDao {
  def findInstallationById(instId: String): Option[PlatformInstallationEntity]
  def findInstallationByPlatformId(platformId: Int): Option[PlatformInstallationEntity]
  def getAllInstallations: List[PlatformInstallationEntity]
  def addInstallation(installation: PlatformInstallationEntity)
  def updateInstallation(installation: PlatformInstallationEntity)
  def deleteInstallation(id: String)
}

class PlatformInstallationDaoImpl(driver: JdbcProfile, db: Database) extends PlatformInstallationDao with LazyLogging {

  import driver.simple._

  private val table = new PlatformInstallationTable(driver)
  private val query = table.query

  override def findInstallationById(id: String): Option[PlatformInstallationEntity] = {
    db.withSession { implicit session =>
      query.filter(_.id === id).firstOption
    }
  }

  override def findInstallationByPlatformId(platformId: Int): Option[PlatformInstallationEntity] = {
    db.withSession { implicit session =>
      query.filter(_.platformId === platformId).firstOption
    }
  }

  override def getAllInstallations: List[PlatformInstallationEntity] = {
    db.withSession { implicit session =>
      query.list
    }
  }

  def addInstallation(installation: PlatformInstallationEntity) = {
    db.withTransaction { implicit session =>
      query += installation
    }
  }

  def updateInstallation(installation: PlatformInstallationEntity) = {
    db.withTransaction { implicit session =>
      query update installation
    }
  }

  def deleteInstallation(id: String) = {
    db.withTransaction { implicit session =>
      table delete id
    }
  }

}
