package com.directv.hw.persistence.dao

import com.directv.hw.core.access.SrvUser
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.hadoop.platform.model.PlatformLocation
import com.directv.hw.persistence.entity._
import org.scalatest.{FlatSpec, Matchers}

class OozieAccessDaoSpec extends FlatSpec with Matchers with H2Test {

  val accessDao = new OozieAccessDaoImpl(driver, db)
  val userDao = new ServiceUserDaoImpl(driver, db)

  "db" should "return inserted platform" in {
    db.withSession(implicit session => {
      keyTable.create
      apiTable.create
      userTable.create
      platformTable.create
      clusterTable.create
      oozieAccessTable.create

      val platformId = 1
      val clusterId1 = "test_cluster1"
      val clusterId2 = "test_cluster2"

      val userId = userDao.addUser(SrvUser(None, "hdfs"))
      apiTable.insert(ApiEntity(Some(1), "CM", Some("5.0.0"), "localhost", 8080, "http", Some("user"), Some("password"), None))
      platformTable.insert(PlatformEntity(Some(platformId), "CDH", "5.0", "cloudera 5", PlatformLocation.onPremise, 1))
      clusterTable.insert(ClusterEntity(platformId, clusterId1, "cluster1"))
      clusterTable.insert(ClusterEntity(platformId, clusterId2, "cluster1"))
      oozieAccessTable.insert(OozieAccessEntity(platformId, clusterId1, Some(userId)))
      oozieAccessTable.insert(OozieAccessEntity(platformId, clusterId2, Some(userId)))

      val hdfs = accessDao.findByCluster(new ClusterPath(platformId, clusterId1)).get
      hdfs.userId shouldBe defined

      // cascade delete
      clusterTable.delete(platformId, clusterId1)
      accessDao.findByCluster(new ClusterPath(platformId, clusterId1)) should not be defined
    })
  }
}
