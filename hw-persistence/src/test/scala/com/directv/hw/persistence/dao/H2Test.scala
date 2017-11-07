package com.directv.hw.persistence.dao

import com.directv.hw.persistence.entity._

trait H2Test {
  val driver = scala.slick.driver.H2Driver
  val db = scala.slick.jdbc.JdbcBackend.Database.forURL("jdbc:h2:mem:test1", driver = "org.h2.Driver")
  val apiTable = new ApiTable(driver)
  val platformTable = new PlatformTable(driver)
  val sessions = new UserSessionTable(driver)
  val properties = new PropertyTable(driver)
  val hdfsAccessTable = new HdfsAccessTable(driver)
  val oozieAccessTable = new OozieAccessTable(driver)
  val indexedWorkflows = new OozieWorkflowTable(driver)
  val tenantTable = new TenantTable(driver)
  val templateInfoTable = new TemplateInfoTable(driver)
  val flumeTemplateTable = new FlumeTemplateTable(driver)
  val userStateTable = new UserStateTable(driver)
  val userSettingsTable = new UserSettingsTable(driver)
  val keyTable = new KeyStoreTable(driver)
  val flumeElementTemplateTable = new FlumeElementTemplateTable(driver)
  val oozieNodeTemplate = new OozieNodeTemplateTable(driver)
  val oozieTemplate = new OozieTemplateTable(driver)
  val oozieWorkflowTable = new OozieWorkflowTable(driver)
  val platformAccessTable = new PlatformAccessTable(driver)
  val userTable = new ServiceUserTable(driver)
  val clusterTable = new ClusterTable(driver)
  val clusterInfoTable = new ClusterSettingsTable(driver)
  val flumeCompTable = new FlumeComponentTable(driver)
}
