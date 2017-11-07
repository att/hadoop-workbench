package com.directv.hw.persistence.dao

import java.sql.SQLException

import com.directv.hw.hadoop.model.{ClusterPath, ModulePath, ServicePath}
import com.directv.hw.persistence.entity._
import com.directv.hw.persistence.exception.OptimisticLockViolation
import com.typesafe.scalalogging.LazyLogging

import scala.slick.driver.JdbcProfile
import scala.slick.jdbc.JdbcBackend._

trait FlumeComponentDao {
  def getComponents: List[FlumeComponentEntity]
  def findComponent(path: ModulePath): Option[FlumeComponentEntity]
  def optimisticSave(component: FlumeComponentEntity): Unit
  def deleteComponent(path: ModulePath): Unit
  def deleteOlderThan(time: Long)
  def findOlderThan(path: ClusterPath, time: Long): List[FlumeComponentEntity]
}

class FlumeComponentDaoImpl(driver: JdbcProfile, db: Database) extends FlumeComponentDao with LazyLogging {

  import driver.simple._

  private val table = new FlumeComponentTable(driver)
  private val query = table.query

  override def getComponents: List[FlumeComponentEntity] = {
    db.withSession { implicit session =>
      query.list
    }
  }

  override def findComponent(path: ModulePath): Option[FlumeComponentEntity] = {
    db.withSession { implicit session =>
      findCompQuery(path)
    }
  }

  private def findCompQuery(path: ModulePath)(implicit session: Session): Option[FlumeComponentEntity] = {
    query.filter { entity =>
      entity.platformId === path.platformId &&
        entity.clusterId === path.clusterId &&
        entity.serviceId === path.serviceId &&
        entity.componentId === path.moduleId
    }.firstOption
  }

  override def optimisticSave(comp: FlumeComponentEntity): Unit = {
    db.withTransaction { implicit session =>
      val path = new ModulePath(comp.platformId, comp.clusterId, comp.serviceId, comp.componentId)
      if (findCompQuery(path).isDefined) {
        val updateQuery = query.filter { entity =>
          entity.platformId === comp.platformId &&
            entity.clusterId === comp.clusterId &&
            entity.serviceId === comp.serviceId &&
            entity.componentId === comp.componentId &&
            entity.lastUpdate < comp.lastUpdate
        }

        val update = updateQuery.update(comp)
        if (update == 0) throw OptimisticLockViolation("component was changed")
      } else {
        try {
          query.insert(comp)
        } catch {
          case e: SQLException if e.getMessage.toLowerCase.contains("unique") =>
            throw OptimisticLockViolation("component was inserted")
        }
      }
    }
  }

  override def deleteComponent(path: ModulePath) = {
    db.withSession { implicit session =>
      table.delete {
        query.filter { entity =>
          entity.platformId === path.platformId &&
            entity.clusterId === path.clusterId &&
            entity.serviceId === path.serviceId &&
            entity.componentId === path.moduleId
        }
      }
    }
  }

  override def deleteOlderThan(time: Long): Unit = {
    db.withSession { implicit session =>
      val filter = query.filter(_.lastUpdate < time)
      table.delete(filter)
    }
  }

  override def findOlderThan(path: ClusterPath, time: Long): List[FlumeComponentEntity] = {
    db.withSession { implicit session =>
      query.filter { entity =>
        entity.lastUpdate < time &&
          entity.platformId === path.platformId &&
          entity.clusterId === path.clusterId
      }.list
    }
  }
}