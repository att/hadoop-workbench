package com.directv.hw.persistence.entity

import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend

case class PlatformInstallationEntity(id: String,
                                      platformId: Int,
                                      clusterName: String,
                                      distrType: String,
                                      distrVersion: String, 
                                      provider: String,
                                      awsRegion: String = "")

class PlatformInstallationTable(val driver: JdbcProfile) {

  import driver.simple._
  val platformTable = new PlatformTable(driver)

  class PlatformInstallationMapping(tag: Tag) extends Table[PlatformInstallationEntity](tag, "PLATFORM_INSTALLATION") {
    def id = column[String]("ID", O.PrimaryKey)
    def platformId = column[Int]("PLATFORM_ID", O.Nullable)
    def clusterName = column[String]("CLUSTER_NAME", O.NotNull)
    def distrType = column[String]("DISTR_TYPE", O.NotNull)
    def distrVersion = column[String]("DISTR_VERSION", O.NotNull)
    def provider = column[String]("PROVIDER", O.NotNull)
    def awsRegion = column[String]("AWS_REGION", O.NotNull)

    def platform = foreignKey("PLATFORM_INSTALLATION_PLATFORM_FK", platformId, platformTable.query)(_.id, onDelete = ForeignKeyAction.Cascade)

    def * = (id, platformId, clusterName, distrType, distrVersion, provider, awsRegion) <> (PlatformInstallationEntity.tupled, PlatformInstallationEntity.unapply)
  }

  val query = TableQuery[PlatformInstallationMapping]

  def delete(id: String)(implicit session: JdbcBackend.Session) = {
    query filter(_.id === id) delete session
  }
  
  def create(implicit session: JdbcBackend.Session) = query.ddl.create(session)
}
