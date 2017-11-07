package com.directv.hw.persistence.dao

import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.persistence.entity._
import com.typesafe.scalalogging.LazyLogging

import scala.language.existentials
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend._

trait HdfsAccessDao {
  def findByPlatform(platformId: Int): List[HdfsAccessEntity]
  def findByCluster(clusterPath: ClusterPath): Option[HdfsAccessEntity]
  def findAll(): List[HdfsAccessEntity]
  def save(hdfs: HdfsAccessEntity): Unit
  def delete(clusterPath: ClusterPath)
}

class HdfsAccessDaoImpl(driver: JdbcProfile, db: Database) extends HdfsAccessDao with LazyLogging {

  import driver.simple._

  val hdfsTable = new HdfsAccessTable(driver)
  val hdfsQuery = hdfsTable.query
  val apiTable = new ApiTable(driver)
  val apiQuery = apiTable.query

  override def findByPlatform(platformId: Int): List[HdfsAccessEntity] = {
    db.withSession { implicit session =>
      val query = for {
        hdfs <- hdfsQuery if hdfs.platformId === platformId
      } yield hdfs

      query.list
    }
  }

  override def findByCluster(clusterPath: ClusterPath): Option[HdfsAccessEntity] = {
    db.withSession { implicit session =>
      val query = for {
        hdfs <- hdfsQuery if (hdfs.platformId === clusterPath.platformId
            && hdfs.clusterId === clusterPath.clusterId)
      } yield hdfs

      query.firstOption
    }
  }

  override def findAll(): List[HdfsAccessEntity] = {
    db.withSession { implicit session =>
      hdfsQuery.list
    }
  }

  override def save(access: HdfsAccessEntity): Unit = {
    db.withTransaction { implicit session =>
      hdfsQuery insertOrUpdate access
    }
  }

  override def delete(clusterPath: ClusterPath): Unit = {
    db.withTransaction { implicit session =>
      hdfsTable.delete(clusterPath.platformId, clusterPath.clusterId)
    }
  }
}
