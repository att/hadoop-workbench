package com.directv.hw.persistence.dao

import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.persistence.entity._
import com.typesafe.scalalogging.LazyLogging

import scala.language.existentials
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend._

trait CustomClusterDataDao {
  def findAll(): List[CustomClusterDataEntity]
  def findByCluster(clusterPath: ClusterPath): List[CustomClusterDataEntity]
  def save(clusterPath: ClusterPath, properties: List[CustomClusterDataEntity]): Unit
  def delete(clusterPath: ClusterPath)
}

class CustomClusterDataDaoImpl(driver: JdbcProfile, db: Database) extends CustomClusterDataDao with LazyLogging {

  private val clusterDataTable = new CustomClusterDataTable(driver)
  import clusterDataTable.driver.simple._

  private val clusterDataQuery = clusterDataTable.query

  override def findByCluster(clusterPath: ClusterPath): List[CustomClusterDataEntity] = {
    db.withSession { implicit session =>
      clusterDataQuery.filter { p =>
        p.platformId === clusterPath.platformId && p.clusterId === clusterPath.clusterId
      }.list
    }
  }

  override def findAll(): List[CustomClusterDataEntity] = {
    db.withSession { implicit session =>
      clusterDataQuery.list
    }
  }

  override def save(clusterPath: ClusterPath, properties: List[CustomClusterDataEntity]): Unit = {
    db.withTransaction { implicit session =>
      clusterDataTable.delete(clusterPath.platformId, clusterPath.clusterId)
      properties.foreach { data => clusterDataQuery insertOrUpdate data }
    }
  }

  override def delete(clusterPath: ClusterPath): Unit = {
    db.withTransaction { implicit session =>
      clusterDataTable.delete(clusterPath.platformId, clusterPath.clusterId)
    }
  }
}
