package com.directv.hw.persistence.dao

import com.directv.hw.persistence.entity.{FlumeTemplateEntity, TemplateInfoEntity, TenantEntity}
import org.scalatest.{FlatSpec, Matchers}

class FlumeTemplateDaoSpec extends FlatSpec with Matchers with H2Test {

  val tenantDao = new TenantDaoImpl(driver, db)
  val flumeTemplateDao = new FlumeTemplateDaoImpl(driver, db)

  val flumeTemplateType = "flume"
  val name = "title"
  val path = "/"

  "FlumeTemplateDao" should "save and return templates" in {
    db.withSession(implicit session => {
      tenantTable.create
      templateInfoTable.create
      flumeTemplateTable.create

      val tenantId = tenantDao.createTenant(TenantEntity(None, "tenant1", "1.0", None))
      flumeTemplateDao.createTemplate(
        TemplateInfoEntity(None, tenantId, flumeTemplateType, name, "1.0", Some("flume description"), None),
        FlumeTemplateEntity(None, "agent")
      )

      val flumeTemplates: List[(TemplateInfoEntity, FlumeTemplateEntity)] = flumeTemplateDao.getAllTemplates
      flumeTemplates should have size 1
      val tuple: (TemplateInfoEntity, FlumeTemplateEntity) = flumeTemplates.head
      tuple._1.name should be (name)
      tuple._2.id.get should be (1)

      val tuple2: (TemplateInfoEntity, FlumeTemplateEntity) = flumeTemplateDao.getTemplate(1)
      tuple2._1.name should be (name)
      tuple2._2.id.get should be (1)
    })
  }
}
