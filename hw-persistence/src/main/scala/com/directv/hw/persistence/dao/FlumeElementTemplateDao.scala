package com.directv.hw.persistence.dao

import com.directv.hw.core.exception.ServerError
import com.directv.hw.hadoop.template.model.UpdateTemplateInfo
import com.directv.hw.persistence.entity.{FlumeElementTemplateEntity, FlumeElementTemplateTable, TemplateInfoEntity, TemplateInfoTable}
import com.typesafe.scalalogging.LazyLogging

import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend._

trait FlumeElementTemplateDao extends TemplateDao[FlumeElementTemplateEntity] {
  def findByElementType(elementType: String): List[(TemplateInfoEntity, FlumeElementTemplateEntity)]
}

class FlumeElementTemplateDaoImpl(driver: JdbcProfile, db: Database) extends FlumeElementTemplateDao with LazyLogging {

  import driver.simple._

  private val infoTable = new TemplateInfoTable(driver)
  private val table = new FlumeElementTemplateTable(driver)

  override def findByElementType(elementType: String): List[(TemplateInfoEntity, FlumeElementTemplateEntity)] = {
    db.withSession { implicit  session =>
      val query = for {
        element <- table.query if element.elementType === elementType
        template <- element.template
      } yield (template, element)

      query.list
    }
  }

  override def getAllTemplates: List[(TemplateInfoEntity, FlumeElementTemplateEntity)] = {
    db.withSession { implicit session =>
      val query = for {
        element <- table.query
        template <- element.template
      } yield (template, element)

      query.list

    }
  }

  override def findTemplates(tenantId: Int): List[(TemplateInfoEntity, FlumeElementTemplateEntity)] = {
    db.withSession { implicit session =>
      val query = for {
        element <- table.query
        template <- element.template if template.tenantId === tenantId
      } yield (template, element)

      query.list
    }
  }

  override def getTemplate(id: Int): (TemplateInfoEntity, FlumeElementTemplateEntity) = {
    db.withSession { implicit session =>
      val entity = table.query.filter(_.id === id).firstOption.getOrElse(throw new ServerError(s"Template with id [$id] not found"))
      val baseEntity = infoTable.query.filter(_.id === id).firstOption.getOrElse(throw new ServerError(s"Template with id [$id] not found"))
      baseEntity -> entity
    }
  }

  override def createTemplate(info: TemplateInfoEntity, entity: FlumeElementTemplateEntity): Int = {
    db.withTransaction { implicit session =>
      val id = infoTable.insert(info)
      table.query.insertOrUpdate(entity.copy(id = Some(id)))
      id
    }
  }

  override def updateTemplate(info: TemplateInfoEntity, entity: FlumeElementTemplateEntity): Unit = {
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