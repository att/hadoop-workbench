package com.directv.hw.hadoop.oozie.service

import com.directv.hw.hadoop.model.ModulePath

trait OozieDeploymentContentServiceFactory {
  def getService(path: ModulePath, user: String): OozieDeploymentContentService
}
