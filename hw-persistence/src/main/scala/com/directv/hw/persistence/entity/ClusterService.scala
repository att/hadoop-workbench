package com.directv.hw.persistence.entity

import com.directv.hw.hadoop.config.ClusterServiceNames
import com.directv.hw.hadoop.config.ClusterServiceNames.ClusterServiceName
import scala.language.postfixOps
import scala.slick.driver.JdbcProfile

case class ClusterServiceEntity(platformId: Int,
                                clusterId: String,
                                name: ClusterServiceName,
                                url: String)

class ClusterServiceTable(val driver: JdbcProfile) {
  import driver.simple._

  implicit val nameMapper = MappedColumnType.base[ClusterServiceName, String] (
    enum => enum.toString,
    str => ClusterServiceNames.withName(str)
  )

  class ClusterServiceMapping(tag: Tag) extends Table[ClusterServiceEntity](tag, "CLUSTER_SERVICE") {
    def platformId = column[Int]("PLATFORM_ID", O.NotNull)
    def clusterId = column[String]("CLUSTER_ID", O.NotNull)
    def name = column[ClusterServiceName]("NAME", O.NotNull)
    def url = column[String]("URL", O.NotNull)

    def * = (platformId, clusterId, name, url) <> (ClusterServiceEntity.tupled, ClusterServiceEntity.unapply)
  }

  val query = TableQuery[ClusterServiceMapping]
}
