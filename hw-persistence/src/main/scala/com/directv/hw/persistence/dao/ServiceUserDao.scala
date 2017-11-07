package com.directv.hw.persistence.dao

import com.directv.hw.core.access.SrvUser
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.persistence.entity._
import com.typesafe.scalalogging.LazyLogging

import scala.language.postfixOps
import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend._

trait ServiceUserDao {
  def deletePrivateUsers(clusterPath: ClusterPath, user: String): Unit
  def deleteUsers(clusterPath: ClusterPath): Unit
  def userById(id: Int): SrvUser
  def users(platformId: Option[Int] = None,
            clusterId: Option[String] = None,
            owner: Option[String] = None,
            team: Option[String] = None): List[SrvUser]

  def addUser(user: SrvUser): Int
  def updateUser(user: SrvUser): Unit
  def deleteUser(id: Int): Unit
}

class ServiceUserDaoImpl(driver: JdbcProfile, db: Database) extends ServiceUserDao with LazyLogging {

  import driver.simple._

  private val userTable = new ServiceUserTable(driver)

  override def userById(id: Int): SrvUser = {
    db.withSession { implicit session =>
      userTable.query.filter(_.id === id).first
    }
  }

  override def users(platformId: Option[Int],
                     clusterId: Option[String],
                     owner: Option[String],
                     team: Option[String]): List[SrvUser] = {

    db.withSession { implicit session =>
      val ownerQuery = owner.map(_ => userTable.query.filter(_.owner === owner))
        .getOrElse(userTable.query.filter(_.owner.isEmpty))

      val platformQuery = platformId.map(_ => ownerQuery.filter(_.platformId === platformId))
        .getOrElse(ownerQuery.filter(_.platformId.isEmpty))

      val clusterQuery = clusterId.map(_ => platformQuery.filter(_.clusterId === clusterId))
        .getOrElse(platformQuery.filter(_.clusterId.isEmpty))

      val teamQuery = team.map(_ => clusterQuery.filter(_.team === team)).getOrElse(clusterQuery)

      teamQuery.list
    }
  }

  override def deleteUser(id: Int): Unit = {
    db.withSession { implicit session =>
      userTable.delete(id)
    }
  }

  override def addUser(user: SrvUser): Int = {
    db.withSession { implicit session =>
      userTable.query returning userTable.query.map(_.id) insert user
    }
  }

  def updateUser(user: SrvUser): Unit = {
    db.withSession { implicit session =>
      userTable.query.filter(_.id === user.id).update(user)
    }
  }

  override def deletePrivateUsers(clusterPath: ClusterPath, owner: String): Unit = {
    db.withSession { implicit session =>
      val filter = userTable.query.filter { user =>
        user.owner === Some(owner).asInstanceOf[Option[String]] &&
          user.platformId === Some(clusterPath.platformId).asInstanceOf[Option[Int]] &&
          user.clusterId === Some(clusterPath.clusterId()).asInstanceOf[Option[String]]
      }

      userTable.delete(filter)
    }
  }

  override def deleteUsers(clusterPath: ClusterPath): Unit = {
    db.withSession { implicit session =>
      val filter = userTable.query.filter { user =>
        user.platformId === Some(clusterPath.platformId).asInstanceOf[Option[Int]] &&
          user.clusterId === Some(clusterPath.clusterId()).asInstanceOf[Option[String]]
      }

      userTable.delete(filter)
    }
  }
}
