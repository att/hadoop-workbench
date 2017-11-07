package com.directv.hw.persistence.dao

import com.directv.hw.core.exception.ServerError
import com.directv.hw.hadoop.template.model.UpdateTemplateInfo
import com.directv.hw.persistence.entity._
import com.typesafe.scalalogging.LazyLogging

import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend._

trait FlumeTemplateDao extends TemplateDao[FlumeTemplateEntity]

class FlumeTemplateDaoImpl(driver: JdbcProfile, db: Database) extends FlumeTemplateDao with LazyLogging {

  import driver.simple._

  protected val infoTable = new TemplateInfoTable(driver)
  private val table = new FlumeTemplateTable(driver)

  override def getAllTemplates: List[(TemplateInfoEntity, FlumeTemplateEntity)] = {
    db.withSession { implicit session =>
      val query = for {
        t <- table.query
        b <- t.base
      } yield (b, t)

      query.list
    }
  }

  override def findTemplates(tenantId: Int): List[(TemplateInfoEntity, FlumeTemplateEntity)] = {
    db.withSession { implicit session =>
      val query = for {
        t <- table.query
        b <- t.base if b.tenantId === tenantId
      } yield (b, t)

      query.list
    }
  }

  override def getTemplate(id: Int): (TemplateInfoEntity, FlumeTemplateEntity) = {
    db.withSession { implicit session =>
      val entity = table.query.filter(_.id === id).firstOption.getOrElse(throw new ServerError(s"Template with id [$id] not found"))
      val baseEntity = infoTable.query.filter(_.id === id).firstOption.getOrElse(throw new ServerError(s"Template with id [$id] not found"))
      baseEntity -> entity
    }
  }

  override def createTemplate(info: TemplateInfoEntity, entity: FlumeTemplateEntity): Int = {
    db.withTransaction { implicit session =>
      val id = infoTable.insert(info)
      table.query.insertOrUpdate(entity.copy(id = Some(id)))
      id
    }
  }

  override def updateTemplate(info: TemplateInfoEntity, entity: FlumeTemplateEntity): Unit = {
    db.withTransaction { implicit session =>
      infoTable.update(info)
      table.query.insertOrUpdate(entity)
    }
  }

  override def updateInfo(id: Int, info: UpdateTemplateInfo): Unit = {
    db.withTransaction { implicit session =>
      infoTable.query.filter(_.id === id)
        .map(i => (i.name, i.version, i.description, i.team))
        .update(info.name, info.version, info.description, info.team)
    }
  }

  override def deleteTemplate(id: Int): Unit = {
    db.withSession { implicit session =>
      infoTable.delete(id)
    }
  }

}
