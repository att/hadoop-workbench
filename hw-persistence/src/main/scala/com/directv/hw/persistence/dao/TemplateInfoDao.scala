package com.directv.hw.persistence.dao

import com.directv.hw.core.exception.ServerError
import com.directv.hw.persistence.entity._
import com.typesafe.scalalogging.LazyLogging

import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend._

trait TemplateInfoDao {
  def getById(id: Int): TemplateInfoEntity
  def delete(id: Int)
}

class TemplateInfoDaoImpl(driver: JdbcProfile, db: Database) extends TemplateInfoDao with LazyLogging {

  import driver.simple._

  private val table = new TemplateInfoTable(driver)

  override def getById(id: Int): TemplateInfoEntity = {
    db.withSession { implicit session =>
      table.query.filter(_.id === id).firstOption.getOrElse(throw new ServerError(s"Template with id [$id] not found"))
    }
  }

  override def delete(id: Int) = {
    db.withSession { implicit session =>
      table.delete(id)
    }
  }

}
