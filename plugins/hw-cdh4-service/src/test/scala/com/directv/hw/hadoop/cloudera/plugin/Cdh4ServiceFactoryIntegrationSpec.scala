package com.directv.hw.hadoop.cloudera.plugin

import com.directv.hw.hadoop.cloudera.ClouderaConnectionData
import com.typesafe.scalalogging.LazyLogging
import org.scalatest.{Matchers, FlatSpec}

class Cdh4ServiceFactoryIntegrationSpec extends FlatSpec with Matchers with LazyLogging {
  val factory = new Cdh4ServiceFactoryImpl
  val conf = new ClouderaConnectionData("dap02", 7180, false, "admin", "admin", 1000, 10000)
  val service = factory.getClouderaClient(conf)

  ignore should "return namenode" in {
    val nameNode = service.getActiveJobTrackerHttpHost("Cluster1")
    logger.debug(s"host - $nameNode")
  }
}
