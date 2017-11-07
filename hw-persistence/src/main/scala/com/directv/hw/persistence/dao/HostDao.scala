package com.directv.hw.persistence.dao

import com.directv.hw.persistence.entity._
import com.typesafe.scalalogging.LazyLogging

import scala.language.postfixOps
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend._

trait HostDao {
  def getRemoteHosts: List[ApiEntity]
  def findHost(address: String): Option[ApiEntity]
  def addHost(apiEntity: ApiEntity): Int
  def updateHost(apiEntity: ApiEntity)
  def deleteHost(id: Int)
}

object HostDao {
  val remoteHostType = "REMOTE"
}

class HostDaoImpl(driver: JdbcProfile, db: Database) extends HostDao with LazyLogging {

  import HostDao._
  import driver.simple._

  private val apiTable = new ApiTable(driver)

  override def getRemoteHosts: List[ApiEntity] = {
    db.withSession { implicit session =>
      apiTable.query filter (_.`type` === remoteHostType) list
    }
  }

  override def findHost(address: String): Option[ApiEntity] = {
    db.withSession { implicit session =>
      apiTable.query filter (api => api.`type` === remoteHostType && api.host === address) firstOption
    }
  }

  override def addHost(apiEntity: ApiEntity): Int = {
    db.withSession { implicit session =>
      apiTable.query returning apiTable.query.map(_.id) insert prepare(apiEntity)
    }
  }

  override def updateHost(apiEntity: ApiEntity) = {
    db.withSession { implicit session =>
      apiTable.query filter(e => e.id === apiEntity.id && e.`type` === remoteHostType) update prepare(apiEntity)
    }
  }

  override def deleteHost(id: Int) = {
    db.withSession { implicit session =>
      // TODO (vkolischuk) make sure only remote entries are deleted
      apiTable delete id
    }
  }

  private def prepare(entity: ApiEntity) = entity.copy(`type` = remoteHostType)

}
