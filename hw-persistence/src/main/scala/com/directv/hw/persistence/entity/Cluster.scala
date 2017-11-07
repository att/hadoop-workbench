package com.directv.hw.persistence.entity

import org.joda.time.DateTime

import scala.language.postfixOps
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

case class ClusterEntity(platformId: Int,
                         clusterId: String,
                         name: String)

class ClusterTable(val driver: JdbcProfile) {
  import driver.simple._

  lazy val platformTable = new PlatformTable(driver)

  class ClusterMapping(tag: Tag) extends Table[ClusterEntity](tag, "CLUSTER") {
    implicit val dateMapper = MappedColumnType.base[DateTime, java.sql.Timestamp](
      dateTime => new java.sql.Timestamp(dateTime.getMillis),
      sqlTimestamp => new DateTime(sqlTimestamp.getTime)
    )

    def platformId = column[Int]("PLATFORM_ID", O.NotNull)
    def clusterId = column[String]("CLUSTER_ID", O.NotNull)
    def name = column[String]("NAME", O.NotNull)

    def * = (platformId, clusterId, name) <> (ClusterEntity.tupled, ClusterEntity.unapply)

    def pk = primaryKey("CLUSTER_PK", (platformId, clusterId))
    def fk = foreignKey("CLUSTER_FK", platformId, platformTable.query)(_.id, onDelete = ForeignKeyAction.Cascade)
  }

  val query = TableQuery[ClusterMapping]

  def delete(platformId: Int, clusterId: String)(implicit session: JdbcBackend.Session) = {
    query filter(c => c.platformId === platformId && c.clusterId === clusterId) delete
  }

  def insert(cluster: ClusterEntity)(implicit session: JdbcBackend.Session) = {
    query insert cluster
  }

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)
}
