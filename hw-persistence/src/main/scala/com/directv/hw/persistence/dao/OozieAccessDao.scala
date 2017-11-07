package com.directv.hw.persistence.dao

import com.directv.hw.core.exception.ServerError
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.persistence.entity._
import com.typesafe.scalalogging.LazyLogging

import scala.language.existentials
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend._

trait OozieAccessDao {
  def findByPlatform(platformId: Int): List[OozieAccessEntity]
  def findByCluster(clusterPath: ClusterPath): Option[OozieAccessEntity]
  def findAll(): List[OozieAccessEntity]
  def save(OozieAccess: OozieAccessEntity)
  def delete(clusterPath: ClusterPath)
}

class OozieAccessDaoImpl(driver: JdbcProfile, db: Database) extends OozieAccessDao with LazyLogging {

  import driver.simple._

  val oozieAccessTable = new OozieAccessTable(driver)
  val oozieAccessQuery = oozieAccessTable.query
  val apiTable= new ApiTable(driver)
  val apiQuery = apiTable.query

  override def findByPlatform(platformId: Int): List[OozieAccessEntity] = {
    db.withSession { implicit session =>
      val query = for {
        access <- oozieAccessQuery if access.platformId === platformId
      } yield access

      query.list
    }
  }

  override def findByCluster(clusterPath: ClusterPath): Option[OozieAccessEntity] = {
    db.withSession { implicit session =>
      val query = for {
        access <- oozieAccessQuery if (access.platformId === clusterPath.platformId
            && access.clusterId === clusterPath.clusterId)
      } yield access

      query.firstOption
    }
  }

  override def findAll(): List[OozieAccessEntity] = {
    db.withSession { implicit session =>
      oozieAccessQuery.list
    }
  }

  override def save(access: OozieAccessEntity) = {
    db.withTransaction { implicit session =>
      oozieAccessTable.query insertOrUpdate access
    }
  }

  override def delete(clusterPath: ClusterPath) = {
    db.withTransaction { implicit session =>
      oozieAccessTable.delete(clusterPath.platformId, clusterPath.clusterId)
    }
  }

}
