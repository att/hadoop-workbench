package com.directv.hw.persistence.dao

import com.directv.hw.core.exception.ServerError
import com.directv.hw.persistence.entity._
import com.typesafe.scalalogging.LazyLogging

import scala.language.postfixOps
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend._

trait TenantDao {
  def getTenants: List[TenantEntity]
  def findTenant(id: Int): Option[TenantEntity]
  def findTenants(name: String): List[TenantEntity]
  def findTenant(name: String, version: String): Option[TenantEntity]
  def createTenant(tenant: TenantEntity): Int
  def updateTenant(tenant: TenantEntity)
  def deleteTenant(id: Int)
}


class TenantDaoImpl(driver: JdbcProfile, db: Database) extends TenantDao with LazyLogging {

  import driver.simple._

  private val table = new TenantTable(driver)
  private val query = table.query

  override def getTenants: List[TenantEntity] = {
    db.withSession { implicit session =>
      query list
    }
  }

  override def findTenant(id: Int): Option[TenantEntity] = {
    db.withSession { implicit session =>
      query filter(_.id === id) firstOption
    }
  }

  override def findTenants(name: String): List[TenantEntity] = {
    db.withSession { implicit session =>
      query filter(_.name === name) list
    }
  }

  override def findTenant(name: String, version: String): Option[TenantEntity] = {
    db.withSession { implicit session =>
      query filter(t => t.name === name && t.version === version) firstOption
    }
  }

  override def createTenant(tenant: TenantEntity): Int = {
    db.withSession { implicit session =>
      query.returning(query.map(_.id)) insert tenant
    }
  }

  override def updateTenant(tenant: TenantEntity) = {
    db.withSession { implicit session =>
      query filter(_.id === tenant.id.get) update tenant
    }
  }

  override def deleteTenant(id: Int) = {
    db.withSession { implicit session =>
      table delete id
    }
  }

}