package com.directv.hw.persistence.dao

import org.scalatest.{FlatSpec, Matchers}

class InitDbSpec extends FlatSpec with Matchers with H2Test {

  ignore should "create al tables" in {
    db.withSession(implicit session => {
      keyTable.create
      apiTable.create
      platformTable.create
      platformAccessTable.create
      tenantTable.create
      templateInfoTable.create
      flumeTemplateTable.create
      flumeElementTemplateTable.create
      oozieTemplate.create
      hdfsAccessTable.create
      oozieNodeTemplate.create
      oozieWorkflowTable.create
      properties.create
      sessions.create
      userSettingsTable.create
      userStateTable.create
    })
  }
}
