package com.directv.hw.persistence.dao

import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.persistence.entity._

import scala.language.existentials
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend._

trait ClusterConfigUpdateDao {
  def find(clusterPath: ClusterPath): Option[ClusterConfigUpdateEntity]
  def save(entity: ClusterConfigUpdateEntity): Unit
}

class ClusterConfigUpdateDaoImpl(driver: JdbcProfile, db: Database) extends ClusterConfigUpdateDao {

  private val clusterConfigUpdateTable = new ClusterConfigUpdateTable(driver)
  import clusterConfigUpdateTable.driver.simple._

  override def find(clusterPath: ClusterPath): Option[ClusterConfigUpdateEntity] = {
    db.withSession { implicit session =>
      clusterConfigUpdateTable.query.filter { update =>
        update.platformId === clusterPath.platformId && update.clusterId === clusterPath.clusterId
      }.firstOption
    }
  }

  override def save(entity: ClusterConfigUpdateEntity): Unit = {
    db.withSession { implicit session =>
      clusterConfigUpdateTable.query.insertOrUpdate(entity)
    }
  }
}
