package com.directv.hw.web.admin

import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.files.ContentService
import scaldi.{Injectable, Injector}

object ClusterConfContentService extends Injectable {
  def apply(platformId: Int, clusterId: String, user: String)(implicit injector: Injector): ContentService = {
    val appConf = inject[AppConf]
    val dir = s"${appConf.clusterConfDir}/$platformId/$clusterId"
    new TextContentService(dir, user)
  }
}