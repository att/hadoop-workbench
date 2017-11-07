package com.directv.hw.persistence.entity

import com.directv.hw.core.access.SrvUser

import scala.language.existentials
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

class ServiceUserTable(val driver: JdbcProfile) {
  import driver.simple._

  class ServiceUserMapping(tag: Tag) extends Table[SrvUser](tag, "USER") {
    def id = column[Int]("ID", O.PrimaryKey, O.AutoInc)
    def name = column[String]("NAME", O.NotNull)
    def owner = column[Option[String]]("OWNER", O.Nullable)
    def keyId = column[Option[Int]]("KEY_ID", O.Nullable)
    def homePath = column[Option[String]]("HOME_PATH", O.Nullable)
    def team = column[Option[String]]("TEAM", O.Nullable)
    def platformId = column[Option[Int]]("PLATFORM_ID", O.Nullable)
    def clusterId = column[Option[String]]("CLUSTER_ID", O.Nullable)

    def key = foreignKey("USER_KEY_FK", keyId, new KeyStoreTable(driver).query)(_.id)

    def * = (id.?, name, owner, keyId, homePath, team, platformId, clusterId) <> (SrvUser.tupled, SrvUser.unapply)
  }

  val query = TableQuery[ServiceUserMapping]

  def insert(user: SrvUser)(implicit session: JdbcBackend.Session) = {
    query += user
  }

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)
  def delete(id: Int)(implicit session: JdbcBackend.Session) = query.filter(_.id === id).delete

  type ServiceUserQuery = Query[ServiceUserMapping, ServiceUserMapping#TableElementType, Seq]
  def delete(filter: ServiceUserQuery)(implicit session: JdbcBackend.Session) = filter.delete
  
}
