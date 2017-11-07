package com.directv.hw.hadoop.platform.service

import com.typesafe.scalalogging.LazyLogging
import scaldi.Injector

class OneServiceInstallator(implicit injector: Injector) extends ClusterInstallatorBase with LazyLogging {

  override protected def configureServices(platfromId: Int, clusterId: String, user: String) = {
    // no services
  }
}
