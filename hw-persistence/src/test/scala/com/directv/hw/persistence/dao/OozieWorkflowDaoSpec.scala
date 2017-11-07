package com.directv.hw.persistence.dao

import com.directv.hw.core.access.SrvUser
import com.directv.hw.hadoop.model.ServicePath
import com.directv.hw.hadoop.platform.model.PlatformLocation
import com.directv.hw.persistence.entity._
import org.scalatest.{FlatSpec, Matchers}

import scala.slick.jdbc.JdbcBackend

class OozieWorkflowDaoSpec extends FlatSpec with Matchers with H2Test {
  private val dao = new OozieWorkflowDaoImpl(driver, db)
  private val userDao = new ServiceUserDaoImpl(driver, db)

  val platformId = 1
  val clusterId = "test_cluster"
  val serviceId = "test_service"

  "db" should "manage workflows" in {
    db.withSession { implicit session =>

      initTables()

      val service = new ServicePath(platformId, clusterId, serviceId)
      dao.getWorkflows(service) should have size 0

      val workflow1 = OozieWorkflowEntity(platformId, clusterId, "path1", "title1", "version1")
      val workflow2 = OozieWorkflowEntity(platformId, clusterId, "path2", "title2", "version2")

      dao.saveWorkflow(workflow1)
      dao.saveWorkflow(workflow2)

      val listA = dao.getWorkflows(service)
      listA should have size 2

      val w1 = listA.find(_._1.path == workflow1.path).get._1
      w1.name should be (workflow1.name)

      val w2 = listA.find(_._1.path == workflow2.path).get._1
      w2.name should be (workflow2.name)

      dao.deleteWorkflow(service, workflow2.path)

      val listB = dao.getWorkflows(service)
      listB should have size 1

      val w1B = listB.find(_._1.path == workflow1.path).get._1
      w1B.name should be (workflow1.name)
    }
  }

  "delete all in path" should "be ok" in {
    db.withSession { implicit session =>

      initTables()

      val service = new ServicePath(platformId, clusterId, serviceId)
      dao.getWorkflows(service) should have size 0

      val workflow1 = OozieWorkflowEntity(platformId, clusterId, "path1", "title1", "version1")
      val workflow2 = OozieWorkflowEntity(platformId, clusterId, "path2", "title2", "version2")

      dao.saveWorkflow(workflow1)
      dao.saveWorkflow(workflow2)

      dao.getWorkflows(service) should have size 2

      dao.deleteWorkflows(service, workflow2.path)

      val wfList = dao.getWorkflows(service)
      wfList should have size 1
      wfList.head._1.name should be (workflow1.name)
    }
  }

  private def initTables()(implicit session: JdbcBackend.Session) = {
    keyTable.create
    userTable.create
    apiTable.create
    platformTable.create
    clusterTable.create
    tenantTable.create
    templateInfoTable.create
    indexedWorkflows.create

    val apiId = 1
    apiTable.insert(ApiEntity(Some(apiId), "CM", Some("5.0.0"), "localhost", 8080, "http", Some("user"), Some("password"), None))
    platformTable.insert(PlatformEntity(Some(platformId), "CDH", "5.0", "cloudera 5", PlatformLocation.onPremise, apiId))
    clusterTable.insert(ClusterEntity(platformId, clusterId, "cluster1"))
    userDao.addUser(SrvUser(None, "hdfs"))
  }
}
