package com.directv.hw.persistence.dao

import com.directv.hw.hadoop.config.ClusterServiceNames.ClusterServiceName
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.persistence.entity._
import com.typesafe.scalalogging.LazyLogging

import scala.language.postfixOps
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend._

trait ClusterServiceDao {
  def findService(clusterPath: ClusterPath, name: ClusterServiceName): Option[ClusterServiceEntity]
  def saveService(entity: ClusterServiceEntity): Unit
  def delete(clusterPath: ClusterPath): Unit
  def deleteAll(): Unit
}

class ClusterServiceDaoImpl(driver: JdbcProfile, db: Database) extends ClusterServiceDao with LazyLogging {

  val table = new ClusterServiceTable(driver)
  import table._
  import table.driver.simple._


  override def findService(clusterPath: ClusterPath, name: ClusterServiceName): Option[ClusterServiceEntity] = {
    db.withSession { implicit session =>
      query.filter { s =>
        s.platformId === clusterPath.platformId && s.clusterId === clusterPath.clusterId && s.name === name
      }.firstOption
    }
  }

  override def saveService(entity: ClusterServiceEntity): Unit = {
    db.withSession { implicit session =>
      query.insertOrUpdate(entity)
    }
  }

  override def deleteAll(): Unit = {
    db.withSession { implicit session =>
      query.delete
    }
  }

  override def delete(clusterPath: ClusterPath): Unit = {
    db.withSession { implicit session =>
      query.filter(srv => srv.platformId === clusterPath.platformId &&
        srv.clusterId === clusterPath.clusterId).delete
    }
  }
}
