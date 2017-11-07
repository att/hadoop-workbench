package com.directv.hw.persistence.dao

import java.time.Instant

import com.directv.hw.hadoop.model.ModulePath
import com.directv.hw.hadoop.platform.model.PlatformLocation
import com.directv.hw.persistence.entity._
import com.directv.hw.persistence.exception.OptimisticLockViolation
import org.scalatest.{FlatSpec, Matchers}

class FlumeComponentDaoSpec extends FlatSpec with Matchers with H2Test {

  val flumeCompDao = new FlumeComponentDaoImpl(driver, db)
  val clusterDao = new ClusterDaoImpl(driver, db)

  "save and get" should "be OK" in {
    db.withSession { implicit session =>
      keyTable.create
      apiTable.create
      platformTable.create
      clusterTable.create
      flumeCompTable.create



      val platformId = 1
      val clusterId = "cluster1"
      val serviceId = "service1"
      val serviceName = "name"
      val componentId = "flume1"
      val compName = "flume1"
      val agentName = "agent1"

      apiTable.insert(ApiEntity(Some(1), "CM", Some("5.0.0"), "localhost", 8080, "http", Some("user"), Some("password"), None))
      platformTable.insert(PlatformEntity(Some(platformId), "CDH", "5.0", "cloudera 5", PlatformLocation.onPremise, 1))

      clusterDao.save(List(ClusterEntity(platformId, clusterId, "cluster1")))

      clusterDao.findByPlatform(platformId) should have size 1
      val timeBeforeFirstInsert = Instant.now().toEpochMilli

      flumeCompDao.optimisticSave (
        FlumeComponentEntity(
          platformId,
          clusterId,
          serviceId,
          componentId,
          compName,
          agentName
        )
      )

      val flumeComp = flumeCompDao.findComponent(new ModulePath(platformId, clusterId, serviceId, componentId))
      flumeComp shouldBe defined

      intercept[OptimisticLockViolation] {
        flumeCompDao.optimisticSave (
          FlumeComponentEntity(
            platformId,
            clusterId,
            serviceId,
            componentId,
            compName,
            agentName,
            timeBeforeFirstInsert
          )
        )
      }
    }
  }
}
