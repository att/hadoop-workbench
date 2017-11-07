package com.directv.hw.persistence.entity

import org.joda.time.DateTime
import scala.language.existentials
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

case class OozieWorkflowEntity(platformId: Int, 
                               clusterId: String, 
                               path: String, 
                               name: String,
                               version: String,
                               env: Option[String] = None,
                               cached: DateTime = DateTime.now(),
                               componentId: Option[Int] = None,
                               team: Option[String] = None)

class OozieWorkflowTable (val driver: JdbcProfile) {
  import driver.simple._

  implicit val dateMapper = MappedColumnType.base[DateTime, java.sql.Timestamp](
    dateTime => new java.sql.Timestamp(dateTime.getMillis),
    sqlTimestamp => new DateTime(sqlTimestamp.getTime))

  class IndexedWorkflowMapping(tag: Tag) extends Table[OozieWorkflowEntity](tag, "OOZIE_WORKFLOW") {
    def platformId = column[Int]("PLATFORM_ID", O.NotNull)
    def clusterId = column[String]("CLUSTER_ID", O.NotNull)
    def path = column[String]("PATH", O.NotNull)
    def name = column[String]("NAME", O.NotNull)
    def version = column[String]("VERSION", O.NotNull)
    def env = column[Option[String]]("ENV", O.Nullable)
    def cached = column[DateTime]("CACHED")(dateMapper)
    def componentId = column[Option[Int]]("COMPONENT_ID", O.Nullable)
    def team = column[Option[String]]("TEAM", O.Nullable)

    def pk = primaryKey("WF_PK", (platformId, clusterId, path))

    def * = (platformId, clusterId, path, name, version, env, cached, componentId, team) <> (OozieWorkflowEntity.tupled, OozieWorkflowEntity.unapply)
  }

  val query = TableQuery[IndexedWorkflowMapping]

  def insert(workflow: OozieWorkflowEntity)(implicit session: JdbcBackend.Session) = query.insert(workflow)(session)

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)

  def delete(filteringQuery: Query[IndexedWorkflowMapping, IndexedWorkflowMapping#TableElementType, Seq])
            (implicit session: JdbcBackend.Session) = {
    filteringQuery.delete
  }
}
