package com.directv.hw.persistence.entity

import java.time.Instant

import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

case class FlumeComponentEntity(platformId: Int,
                                clusterId: String,
                                serviceId: String,
                                componentId: String,
                                componentName: String,
                                agentName: String,
                                lastUpdate: Long = Instant.now().toEpochMilli)

class FlumeComponentTable(val driver: JdbcProfile) {
  import driver.simple._

  class FlumeComponentMaping(tag: Tag) extends Table[FlumeComponentEntity](tag, "FLUME_COMPONENT") {
    def platformId = column[Int]("PLATFORM_ID", O.NotNull)
    def clusterId = column[String]("CLUSTER_ID", O.NotNull)
    def serviceId = column[String]("SERVICE_ID", O.NotNull)
    def componentId = column[String]("COMPONENT_ID", O.NotNull)
    def componentName = column[String]("COMPONENT_NAME", O.NotNull)
    def agentName = column[String]("AGENT_NAME", O.NotNull)
    def lastUpdate = column[Long]("LAST_UPDATE", O.NotNull)

    def pk = primaryKey("FLUME_COMP_PK", (platformId, clusterId, serviceId, componentId))

    def * = (platformId, clusterId, serviceId, componentId, componentName, agentName, lastUpdate) <>
      (FlumeComponentEntity.tupled, FlumeComponentEntity.unapply)
  }

  val query = TableQuery[FlumeComponentMaping]
  type UserStateQuery = Query[FlumeComponentMaping, FlumeComponentMaping#TableElementType, Seq]

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)
  def delete(filter: UserStateQuery)(implicit session: JdbcBackend.Session) = filter.delete
}
