package com.directv.hw.persistence.dao

import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.persistence.entity._
import com.typesafe.scalalogging.LazyLogging

import scala.language.postfixOps
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend._

trait ClusterDao {
  def getAll: List[ClusterEntity]
  def findByPlatform(platformId: Int): List[ClusterEntity]
  def save(cluster: ClusterEntity): Unit
  def save(clusters: List[ClusterEntity])
  def retain(platformId: Int, clusterIds: List[String])
  def getAllRealms: List[String]
  def getClusterSettings(clusterPath: ClusterPath): Option[ClusterSettingsEntity]
  def saveClusterSettings(clusterSettingsEntity: ClusterSettingsEntity): Unit
}

class ClusterDaoImpl(driver: JdbcProfile, db: Database) extends ClusterDao with LazyLogging {

  import driver.simple._

  val table = new ClusterTable(driver)
  val query = table.query

  val infoTable = new ClusterSettingsTable(driver)
  val settingsQuery = infoTable.query

  override def getAll: List[ClusterEntity] = {
    db.withSession { implicit session =>
      query.list
    }
  }

  override def findByPlatform(platformId: Int): List[ClusterEntity] = {
    db.withSession { implicit session =>
      query filter (_.platformId === platformId) list
    }
  }

  override def save(cluster: ClusterEntity): Unit = {
    db.withSession { implicit session =>
      query.insertOrUpdate(cluster)
    }
  }

  override def save(clusters: List[ClusterEntity]) = {
    db.withSession { implicit session =>
      clusters foreach query.insertOrUpdate
    }
  }

  override def retain(platformId: Int, clusterIds: List[String]) = {
    db.withSession { implicit session =>
      val existing = query filter (_.platformId === platformId) list
      val toKeep = clusterIds.toSet
      existing withFilter(c => ! toKeep.contains(c.clusterId)) foreach { c =>
        table.delete(platformId, c.clusterId)
      }
    }
  }

  override def getAllRealms: List[String] = {
    db.withSession { implicit session =>
      settingsQuery.map(_.realm.?).list.flatten.distinct
    }
  }

  override def getClusterSettings(clusterPath: ClusterPath): Option[ClusterSettingsEntity] = {
    db.withSession { implicit session =>
      settingsQuery
        .filter(entity => entity.platformId === clusterPath.platformId && entity.clusterId === clusterPath.clusterId)
        .firstOption
    }
  }

  override def saveClusterSettings(clusterSettingsEntity: ClusterSettingsEntity) = {
    db.withSession { implicit session =>
      settingsQuery.insertOrUpdate(clusterSettingsEntity)
    }
  }
}
