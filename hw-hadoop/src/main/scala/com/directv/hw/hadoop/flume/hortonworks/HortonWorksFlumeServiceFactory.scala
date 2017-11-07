package com.directv.hw.hadoop.flume.hortonworks

import com.directv.hw.hadoop.flume.FlumeServiceFactory
import com.directv.hw.hadoop.flume.service.FlumeService
import com.directv.hw.persistence.entity.ApiEntity
import scaldi.{Injectable, Injector}

class HortonWorksFlumeServiceFactory(implicit injector: Injector) extends FlumeServiceFactory with Injectable {

  override def getFlumeService(platformId: Int, platformVersion: String, platformApi: ApiEntity): FlumeService = {
    new HortonWorksFlumeService(platformId, platformApi)
  }
}
