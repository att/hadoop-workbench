package com.directv.hw.persistence.entity

import com.directv.hw.hadoop.access.{KeyFile, KeyTypes}
import com.directv.hw.hadoop.access.KeyTypes.KeyType

import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

class KeyStoreTable(val driver: JdbcProfile) {

  import driver.simple._

  implicit val nameMapper = MappedColumnType.base[KeyType, String] (
    enum => enum.toString,
    str => KeyTypes.withName(str)
  )

  class KeyStoreMapping(tag: Tag) extends Table[KeyFile](tag, "KEY_FILE") {
    def id = column[Int]("ID", O.PrimaryKey, O.AutoInc)
    def `type` = column[KeyType]("TYPE")
    def name = column[String]("NAME")
    def owner = column[Option[String]]("OWNER", O.Nullable)
    def platformId = column[Option[Int]]("PLATFORM_ID", O.Nullable)
    def clusterId = column[Option[String]]("CLUSTER_ID", O.Nullable)

    def * = (id.?, `type`, name, owner, platformId, clusterId) <> (KeyFile.tupled, KeyFile.unapply)
  }

  val query = TableQuery[KeyStoreMapping]

  def insert(key: KeyFile)(implicit session: JdbcBackend.Session) = {
    query.insert(key)
  }

  def delete(platformId: Int)(implicit session: JdbcBackend.Session) = {
    query filter(_.id === platformId) delete session
  }

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)
}
