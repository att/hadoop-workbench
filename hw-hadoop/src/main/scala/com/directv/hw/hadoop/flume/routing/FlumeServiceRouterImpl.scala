package com.directv.hw.hadoop.flume.routing

import com.directv.hw.core.exception.CalleeException
import com.directv.hw.hadoop.flume.FlumeServiceFactory
import com.directv.hw.hadoop.flume.service.FlumeService
import com.directv.hw.persistence.dao.PlatformDao
import scaldi.{Injectable, Injector}

class FlumeServiceRouterImpl(factories: Map[String, FlumeServiceFactory])(implicit injector: Injector)
  extends FlumeServiceRouter with Injectable {

  val hadoopDao = inject[PlatformDao]

  override def getFlumeService(platformId: Int): FlumeService = {
    val (platform, api) = hadoopDao.findPlatformById(platformId)
    val maybeFactory = factories.get(platform.`type`)
    if (maybeFactory.isEmpty) {
      throw new CalleeException(s"Could not find factory with type [${platform.`type`}] for platform id [$platformId]")
    }

    maybeFactory.get.getFlumeService(platformId, platform.version, api)
  }
}
