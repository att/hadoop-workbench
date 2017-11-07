package com.directv.hw.hadoop.oozie.service

trait OozieComponentContentServiceFactory {
  def getService(templateId: Int, user: String): OozieComponentContentService
}
