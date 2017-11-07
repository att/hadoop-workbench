package com.directv.hw.persistence.entity

import org.joda.time.DateTime

import scala.language.existentials
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

case class ClusterConfigUpdateEntity(platformId: Int,
                                     clusterId: String,
                                     success: Boolean,
                                     date: DateTime = DateTime.now())

class ClusterConfigUpdateTable(val driver: JdbcProfile) {
  import driver.simple._

  implicit val dateMapper = MappedColumnType.base[DateTime, java.sql.Timestamp](
    dateTime => new java.sql.Timestamp(dateTime.getMillis),
    sqlTimestamp => new DateTime(sqlTimestamp.getTime))

  class ClusterConfigUpdateMapping(tag: Tag) extends Table[ClusterConfigUpdateEntity](tag, "CLUSTER_CONFIG_UPDATE") {
    def platformId = column[Int]("PLATFORM_ID", O.NotNull)
    def clusterId = column[String]("CLUSTER_ID", O.NotNull)
    def date = column[DateTime]("DATE", O.NotNull)
    def success = column[Boolean]("SUCCESS", O.NotNull)
    def cluster = foreignKey("CLUSTER_CONFIG_UPDATE_FK", (platformId, clusterId),
      new ClusterTable(driver).query)(c => (c.platformId, c.clusterId), onDelete = ForeignKeyAction.Cascade)
    
    def pk = primaryKey("CLUSTER_CONFIG_UPDATE_PK", (platformId, clusterId))
    def * = (platformId, clusterId, success, date) <> (ClusterConfigUpdateEntity.tupled, ClusterConfigUpdateEntity.unapply)
  }

  val query = TableQuery[ClusterConfigUpdateMapping]

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)
}
