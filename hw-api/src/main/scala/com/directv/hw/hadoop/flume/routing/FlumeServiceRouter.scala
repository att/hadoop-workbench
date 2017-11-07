package com.directv.hw.hadoop.flume.routing

import com.directv.hw.hadoop.flume.service.FlumeService

trait FlumeServiceRouter {
  def getFlumeService(platformId: Int): FlumeService
}
