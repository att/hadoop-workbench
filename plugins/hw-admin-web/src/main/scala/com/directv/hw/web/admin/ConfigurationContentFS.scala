package com.directv.hw.web.admin

import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.files.ContentService
import scaldi.{Injectable, Injector}

object ConfigurationContentFS extends Injectable{
  def apply(user: String)(implicit injector: Injector): ContentService = {
    val appConf = inject[AppConf]
    new TextContentService(appConf.confDir, user)
  }
}
