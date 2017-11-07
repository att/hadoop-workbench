package com.directv.hw.persistence.dao

import org.scalatest.{Matchers, FlatSpec}

class PropertyDaoSpecSpec extends FlatSpec with Matchers with H2Test {
  val propertyDao = new PropertyDaoImpl(driver, db)

  "PropertyDao" should "store and delete properties" in {
    db.withSession { implicit session =>
      properties.create

      val key1 = "key1"
      val key2 = "key2"
      val value1 = "value1"
      val value2 = "value2"

      // test save correct values
      propertyDao.saveValue(key1, value1)
      propertyDao.getValue(key1) should be (value1)

      propertyDao.saveValue(key1, value2)
      propertyDao.getValue(key1) should be (value2)

      // test strict delete
      propertyDao.saveValue(key2, value2)
      propertyDao.delete(key1)

      propertyDao.getValue(key1) should be (null)
      propertyDao.getValue(key2) should be (value2)
    }
  }

  "PropertyDao" should "delele properties by partial key" in {
    db.withSession { implicit session =>
      properties.create

      val key1 = "key1"
      val key2 = "key2"
      val value1 = "value1"
      val value2 = "value2"

      propertyDao.saveValue(key1, value1)
      propertyDao.saveValue(key2, value2)

      propertyDao.deleteByPartialKey("key")

      propertyDao.getValue(key1) should be (null)
      propertyDao.getValue(key2) should be (null)
    }
  }

}
