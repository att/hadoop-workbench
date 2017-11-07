package com.directv.hw.persistence.dao

import com.directv.hw.hadoop.platform.exception.PlatformNotFoundException
import com.directv.hw.persistence.entity._
import com.typesafe.scalalogging.LazyLogging

import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend._

trait PlatformDao {
  def findPlatformById(id: Int): (PlatformEntity, ApiEntity)
  def getAllPlatforms: List[(PlatformEntity, ApiEntity)]
  def addPlatform(platform: PlatformEntity, api: ApiEntity): Int
  def updatePlatform(platform: PlatformEntity, api: ApiEntity)
  def updateApi(api: ApiEntity): Boolean
  def deletePlatform(platformId: Int)
}

class PlatformDaoImpl(driver: JdbcProfile, db: Database) extends PlatformDao with LazyLogging {

  import driver.simple._

  private val apiTable = new ApiTable(driver)
  private val apiQuery = apiTable.query
  private val platformTable = new PlatformTable(driver)
  private val platformQuery = platformTable.query
  private val platformAccessTable = new PlatformAccessTable(driver)
  private val clusterTable = new ClusterTable(driver)
  private val hdfsTable = new HdfsAccessTable(driver)
  private val oozieAccessTable = new OozieAccessTable(driver)

  override def findPlatformById(id: Int): (PlatformEntity, ApiEntity) = {
    db.withSession { implicit session =>
      val query = for {
        p <- platformQuery if p.id === id
        a <- p.api
      } yield (p, a)

      query.firstOption.getOrElse(throw PlatformNotFoundException())
    }
  }

  override def updateApi(api: ApiEntity): Boolean = {
    db.withSession { implicit session =>
      val result = apiQuery.filter(_.id === api.id).update(api)
      result > 0
    }
  }

  override def getAllPlatforms: List[(PlatformEntity, ApiEntity)] = {
    db.withSession { implicit session =>
      val query = for {
        p <- platformQuery
        a <- p.api
      } yield (p, a)

      query.list
    }
  }

  def addPlatform(platform: PlatformEntity, api: ApiEntity): Int = {
    db.withTransaction { implicit session =>
      val apiId = apiQuery returning apiQuery.map(_.id) insert api
      platformQuery returning platformQuery.map(_.id) insert platform.copy(apiId = apiId)
    }
  }


  def updatePlatform(platform: PlatformEntity, api: ApiEntity) = {
    db.withTransaction { implicit session =>

      val apiIdQuery = for {
          p <- platformQuery if p.id === platform.id
          a <- p.api
      } yield a.id

      val apiId = apiIdQuery.first

      platformQuery.filter(_.id === platform.id).update(platform.copy(apiId = apiId))
      apiQuery.filter(_.id === apiId).update(api.copy(id = Some(apiId)))
    }
  }

  def deletePlatform(platformId: Int) = {
    db.withTransaction { implicit session =>
      val clusterList = clusterTable.query.filter(_.platformId === platformId).list
      val hdfsList = hdfsTable.query.filter(_.platformId === platformId).list
      val oozieAccessList = oozieAccessTable.query.filter(_.platformId === platformId).list
      platformAccessTable.delete(platformId)
      platformTable.delete(platformId)
    }
  }
}
