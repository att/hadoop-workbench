package com.directv.hw.persistence.dao

import com.directv.hw.hadoop.platform.model.PlatformLocation
import com.directv.hw.persistence.entity.{ApiEntity, ClusterEntity, PlatformEntity}
import org.scalatest.{FlatSpec, Matchers}

class ClusterDaoSpec extends FlatSpec with Matchers with H2Test {

  val clusterDao = new ClusterDaoImpl(driver, db)

  "2 duplicated clusters" should "should be saved as 1" in {
    db.withSession(implicit session => {
      keyTable.create
      apiTable.create
      platformTable.create
      clusterTable.create

      val platformId = 1
      val clusterId = "test_cluster"

      apiTable.insert(ApiEntity(Some(1), "CM", Some("5.0.0"), "localhost", 8080, "http", Some("user"), Some("password"), None))
      platformTable.insert(PlatformEntity(Some(platformId), "CDH", "5.0", "cloudera 5", PlatformLocation.onPremise, 1))

      clusterDao.save(List(ClusterEntity(platformId, clusterId, "cluster1")))
      clusterDao.findByPlatform(platformId) should have size 1

      clusterDao.save(List(ClusterEntity(platformId, clusterId, "cluster2")))
      clusterDao.findByPlatform(platformId) should have size 1
    })
  }
}
