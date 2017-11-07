package com.directv.hw.persistence.dao

import com.directv.hw.hadoop.platform.model.PlatformLocation
import com.directv.hw.persistence.entity.{ApiEntity, PlatformEntity}
import org.scalatest.{FlatSpec, Matchers}

class HadoopDaoSpec extends FlatSpec with Matchers with H2Test {

  val hadoopDao = new PlatformDaoImpl(driver, db)

  "db" should "return inserted platform" in {
    db.withSession(implicit session => {
      keyTable.create
      apiTable.create
      platformTable.create
      apiTable.insert(ApiEntity(Some(1), "CM", Some("5.0.0"), "localhost", 8080, "http", Some("user"), Some("password"), None))
      platformTable.insert(PlatformEntity(Some(1), "CDH", "5.0", "cloudera 5", PlatformLocation.amazon, 1))

      val platform = hadoopDao.findPlatformById(1)
      platform._1.`type` should be("CDH")
      platform._1.version should be("5.0")
      platform._2.`type` should be("CM")
      platform._2.version.get should be("5.0.0")
      platform._2.host should be("localhost")
      platform._2.port should be(8080)
      platform._2.protocol should be("http")
      platform._2.user.get should be("user")
      platform._2.password.get should be("password")
      platform._2.keyId should be(None)
    })
  }
}
