package com.directv.hw.hadoop.oozie.service

import com.directv.hw.hadoop.model.ModulePath
import scaldi.{Injectable, Injector}

class OozieDeploymentContentServiceFactoryImpl(implicit injector: Injector)
  extends OozieDeploymentContentServiceFactory with Injectable {

  override def getService(path: ModulePath, user: String): OozieDeploymentContentService = {
    new OozieDeploymentContentServiceImpl(path, user)
  }
}
