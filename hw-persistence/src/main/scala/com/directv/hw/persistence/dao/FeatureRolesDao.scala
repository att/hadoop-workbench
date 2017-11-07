package com.directv.hw.persistence.dao

import com.directv.hw.core.auth.SecurityFeatures.SecurityFeature
import com.directv.hw.persistence.entity.{FeatureRolesTable, UserRolesEntity}

import scala.slick.driver.JdbcDriver
import scala.slick.jdbc.JdbcBackend.Database


trait FeatureRolesDao {
  def features(role: String): Set[SecurityFeature]
}

class FeatureRolesDaoImpl(driver: JdbcDriver, db: Database) extends FeatureRolesDao {

  private val rolesTable = new FeatureRolesTable(driver)
  private val query = rolesTable.query

  import  rolesTable.driver.simple._

   override def features(role: String): Set[SecurityFeature] = {
    db.withSession { implicit session =>
      query.filter(_.role === role).map(_.feature).list.toSet
    }
  }
}