package com.directv.hw.hadoop.flume

import com.directv.hw.hadoop.flume.service.FlumeService
import com.directv.hw.persistence.entity.ApiEntity

trait FlumeServiceFactory {
  def getFlumeService(platformId: Int, platformVersion: String, platformApi: ApiEntity): FlumeService
}
