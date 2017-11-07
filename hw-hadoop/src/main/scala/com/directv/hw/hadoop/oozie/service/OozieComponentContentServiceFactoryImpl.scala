package com.directv.hw.hadoop.oozie.service

import scaldi.{Injectable, Injector}

class OozieComponentContentServiceFactoryImpl(implicit injector: Injector)
  extends OozieComponentContentServiceFactory with Injectable {

  override def getService(templateId: Int, user: String): OozieComponentContentService = {
    new OozieComponentContentServiceImpl(templateId, user)
  }
}
