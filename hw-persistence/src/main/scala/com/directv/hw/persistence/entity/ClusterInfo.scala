package com.directv.hw.persistence.entity

import org.joda.time.DateTime

import scala.language.postfixOps
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend
import scala.language.existentials

case class ClusterSettingsEntity(platformId: Int,
                             clusterId: String,
                             kerberized: Boolean = false,
                             realm: Option[String] = None)

class ClusterSettingsTable(val driver: JdbcProfile) {
  import driver.simple._

  class ClusterSettingsMapping(tag: Tag) extends Table[ClusterSettingsEntity](tag, "CLUSTER_SETTINGS") {
    implicit val dateMapper = MappedColumnType.base[DateTime, java.sql.Timestamp](
      dateTime => new java.sql.Timestamp(dateTime.getMillis),
      sqlTimestamp => new DateTime(sqlTimestamp.getTime)
    )

    def platformId = column[Int]("PLATFORM_ID", O.NotNull)
    def clusterId = column[String]("CLUSTER_ID", O.NotNull)
    def kerberized = column[Boolean]("KERBERIZED", O.NotNull)
    def realm = column[String]("REALM", O.Nullable)

    def * = (platformId, clusterId, kerberized, realm.?) <> (ClusterSettingsEntity.tupled, ClusterSettingsEntity.unapply)

    def pk = primaryKey("CLUSTER_INFO_PK", (platformId, clusterId))
    def fk = foreignKey("CLUSTER_INFO_FK", (platformId, clusterId),
      new ClusterSettingsTable(driver).query)(c => (c.platformId, c.clusterId), onDelete = ForeignKeyAction.Cascade)
  }

  val query = TableQuery[ClusterSettingsMapping]

  def insert(settings: ClusterSettingsEntity)(implicit session: JdbcBackend.Session) = {
    query insert settings
  }

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)
}
