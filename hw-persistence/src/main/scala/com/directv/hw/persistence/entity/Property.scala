package com.directv.hw.persistence.entity

import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

case class PropertyEntity(key: String, value: String)

class PropertyTable(val driver: JdbcProfile) {
  import driver.simple._

  class PropertyMapping(tag: Tag) extends Table[PropertyEntity](tag, "PROPERTY") {
    def key = column[String]("_KEY", O.NotNull)
    def value = column[String]("_VALUE", O.NotNull)

    def pk = primaryKey("PK", key)

    def * = (key, value) <>(PropertyEntity.tupled, PropertyEntity.unapply)
  }

  val query = TableQuery[PropertyMapping]

  def create(implicit session: JdbcBackend.Session) = query.ddl.create

  type PropertyQuery = Query[PropertyMapping, PropertyMapping#TableElementType, Seq]

  def delete(filter: PropertyQuery)(implicit session: JdbcBackend.Session) = filter.delete

}
