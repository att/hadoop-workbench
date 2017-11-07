package com.directv.hw.persistence.entity

import scala.language.existentials
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

case class HdfsAccessEntity(platformId: Int,
                            clusterId: String,
                            userId: Option[Int])

class HdfsAccessTable(val driver: JdbcProfile) {
  import driver.simple._

  val apiTable = new ApiTable(driver)

  class HdfsMapping(tag: Tag) extends Table[HdfsAccessEntity](tag, "HDFS_ACCESS") {
    def platformId = column[Int]("PLATFORM_ID", O.NotNull)
    def clusterId = column[String]("CLUSTER_ID", O.NotNull)
    def userId = column[Int]("USER_ID", O.NotNull)

    def cluster = foreignKey("HDFS_CLUSTER_FK", (platformId, clusterId),
      new ClusterTable(driver).query)(c => (c.platformId, c.clusterId), onDelete = ForeignKeyAction.Cascade)

    def user = foreignKey("HDFS_USER_FK", userId, 
      new ServiceUserTable(driver).query)(_.id, onDelete = ForeignKeyAction.SetNull)
    
    def cluster_pk = primaryKey("HDFS_CLUSTER_UK", (platformId, clusterId))

    def * = (platformId, clusterId, userId.?) <> (HdfsAccessEntity.tupled, HdfsAccessEntity.unapply)
  }

  val query = TableQuery[HdfsMapping]

  def insert(hdfs: HdfsAccessEntity)(implicit session: JdbcBackend.Session) = query.insert(hdfs)(session)

  def delete(platformId: Int, clusterId: String)(implicit session: JdbcBackend.Session) = {
    query.filter(access => access.platformId === platformId && access.clusterId === clusterId ).delete
  } 

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)
}
