package com.directv.hw.hadoop.flume.cloudera

import com.directv.hw.hadoop.cloudera.routing.ClouderaVersionRouter
import com.directv.hw.hadoop.flume.FlumeServiceFactory
import com.directv.hw.hadoop.flume.service.FlumeService
import com.directv.hw.persistence.dao.PlatformDao
import com.directv.hw.persistence.entity.ApiEntity
import scaldi.{Injectable, Injector}

class ClouderaFlumeServiceFactory(implicit injector: Injector) extends FlumeServiceFactory with Injectable {
  val hadoopDao = inject[PlatformDao]
  val clouderaRouter = inject[ClouderaVersionRouter]

  override def getFlumeService(platformId: Int, platformVersion: String, platformApi: ApiEntity): FlumeService = {
    val clouderaManagerService = clouderaRouter.findClient(platformVersion, platformApi)
    new ClouderaFlumeService(clouderaManagerService)
  }
}
