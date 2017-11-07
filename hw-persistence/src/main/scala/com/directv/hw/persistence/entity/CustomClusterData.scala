package com.directv.hw.persistence.entity

import scala.language.existentials
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

case class CustomClusterDataEntity(platformId: Int,
                                   clusterId: String,
                                   key: String,
                                   value: String,
                                   description: Option[String])

class CustomClusterDataTable(val driver: JdbcProfile) {
  import driver.simple._

  class CustomClusterDataMapping(tag: Tag) extends Table[CustomClusterDataEntity](tag, "CUSTOM_CLUSTER_DATA") {
    def platformId = column[Int]("PLATFORM_ID", O.NotNull)
    def clusterId = column[String]("CLUSTER_ID", O.NotNull)
    def key = column[String]("KEY_", O.NotNull)
    def value = column[String]("VALUE_", O.NotNull)
    def desciption = column[String]("DESCRIPTION", O.Nullable)

    def cluster = foreignKey("CUSTOM_CLUSTER_DATA_CLUSTER_FK", (platformId, clusterId),
      new ClusterTable(driver).query)(c => (c.platformId, c.clusterId), onDelete = ForeignKeyAction.Cascade)
    
    def cluster_pk = primaryKey("CUSTOM_CLUSTER_DATA_PK", (platformId, clusterId, key))

    def * = (platformId, clusterId, key, value, desciption.?) <> (CustomClusterDataEntity.tupled, CustomClusterDataEntity.unapply)
  }

  val query = TableQuery[CustomClusterDataMapping]

  def insert(entity: CustomClusterDataEntity)(implicit session: JdbcBackend.Session) = query.insert(entity)(session)

  def delete(platformId: Int, clusterId: String)(implicit session: JdbcBackend.Session) = {
    query.filter(entity => entity.platformId === platformId && entity.clusterId === clusterId ).delete
  } 

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)
}
