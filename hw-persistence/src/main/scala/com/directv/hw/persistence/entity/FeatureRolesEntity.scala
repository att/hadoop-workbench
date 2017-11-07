package com.directv.hw.persistence.entity

import com.directv.hw.core.auth.SecurityFeatures
import com.directv.hw.core.auth.SecurityFeatures.SecurityFeature
import scala.slick.driver.JdbcDriver

case class FeatureRolesEntity(feature: SecurityFeature, role: String)

class FeatureRolesTable(val driver: JdbcDriver) {

  import driver.simple._

  implicit val nameMapper = MappedColumnType.base[SecurityFeature, String] (
    enum => enum.toString,
    str => SecurityFeatures.fromString(str)
  )

  class FeatureRolesMapping(tag: Tag) extends Table[FeatureRolesEntity](tag, "FEATURE_ROLES") {
    def feature = column[SecurityFeature]("FEATURE", O.NotNull)
    def role = column[String]("ROLE", O.NotNull)

    def pk = primaryKey("FEATURE_ROLES_PK", (feature, role))
    def * = (feature, role) <> (FeatureRolesEntity.tupled, FeatureRolesEntity.unapply)
  }

  val query = TableQuery[FeatureRolesMapping]
}