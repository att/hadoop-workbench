package com.directv.hw.persistence.entity

import scala.language.existentials
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

case class OozieAccessEntity(platformId: Int,
                             clusterId: String,
                             userId: Option[Int])

class OozieAccessTable(val driver: JdbcProfile) {
  import driver.simple._

  val apiTable = new ApiTable(driver)

  class OozieAccessMapping(tag: Tag) extends Table[OozieAccessEntity](tag, "OOZIE_ACCESS") {
    def platformId = column[Int]("PLATFORM_ID", O.NotNull)
    def clusterId = column[String]("CLUSTER_ID", O.NotNull)
    def userId = column[Int]("USER_ID", O.NotNull)

    def cluster_fk = foreignKey("OOZIE_CLUSTER_FK", (platformId, clusterId),
      new ClusterTable(driver).query)(c => (c.platformId, c.clusterId), onDelete = ForeignKeyAction.Cascade)

    def user_fk = foreignKey("OOZIE_USER_FK", userId,
      new ServiceUserTable(driver).query)(_.id, onDelete = ForeignKeyAction.SetNull)

    def cluster_pk = primaryKey("OOZIE_CLUSTER_UK", (platformId, clusterId))

    def * = (platformId, clusterId, userId.?) <> (OozieAccessEntity.tupled, OozieAccessEntity.unapply)
  }

  val query = TableQuery[OozieAccessMapping]

  def insert(OozieAccess: OozieAccessEntity)(implicit session: JdbcBackend.Session) = query.insert(OozieAccess)(session)

  def delete(platformId: Int, clusterId: String)(implicit session: JdbcBackend.Session) = {
    query.filter(access => access.platformId === platformId && access.clusterId === clusterId ).delete
  }

  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)
}
