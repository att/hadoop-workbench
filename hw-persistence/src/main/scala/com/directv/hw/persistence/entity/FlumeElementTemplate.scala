package com.directv.hw.persistence.entity

import com.directv.hw.core.exception.ServerError

import scala.language.existentials
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

case class FlumeElementTemplateEntity(id: Option[Int], elementType: String, elementSubtype: String, agentName: String, nodeName: String)

class FlumeElementTemplateTable(val driver: JdbcProfile) {

  import driver.simple._

  class FlumeElementTemplateMapping(tag: Tag) extends Table[FlumeElementTemplateEntity](tag, "FLUME_ELEMENT_TEMPLATE") {
    def id = column[Int]("ID", O.PrimaryKey)
    def elementType = column[String]("ELEMENT_TYPE", O.NotNull)
    def elementSubtype = column[String]("ELEMENT_SUBTYPE", O.NotNull)
    def agentName = column[String]("AGENT_NAME", O.NotNull)
    def nodeName = column[String]("NODE_NAME", O.NotNull)

    def template = foreignKey("FLUME_ELEMENT_TEMPLATE_FK", id, new TemplateInfoTable(driver).query)(_.id, onDelete = ForeignKeyAction.Cascade)

    def * = (id.?, elementType, elementSubtype, agentName, nodeName) <> (FlumeElementTemplateEntity.tupled, FlumeElementTemplateEntity.unapply)
  }

  val query = TableQuery[FlumeElementTemplateMapping]

  def getById(id: Int)(implicit session: JdbcBackend.Session): FlumeElementTemplateEntity = {
    query.filter(_.id === id).firstOption.getOrElse(throw new ServerError(s"Flume Element with id [$id] not found"))
  }

  def insert(element: FlumeElementTemplateEntity)(implicit session: JdbcBackend.Session) = {
    val existing = query.filter { entity =>
      entity.id === element.id
    }.firstOption
    if(existing.isDefined) {
      throw new ServerError(s"Flume Element [${element.elementType}] with type [${element.elementSubtype}] already exists ")
    }
    query.returning(query.map(_.id)).insert(element)
  }

  def update(element: FlumeElementTemplateEntity)(implicit session: JdbcBackend.Session) = {
    query.filter(_.id === element.id.get).update(element)
  }

  def delete(id: Int)(implicit session: JdbcBackend.Session) = {
    query.filter(_.id === id).delete
  }

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)
}
