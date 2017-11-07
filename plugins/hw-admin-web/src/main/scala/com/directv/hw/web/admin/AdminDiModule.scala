package com.directv.hw.web.admin

import com.directv.hw.core.plugin.DapPluginManager
import com.directv.hw.core.service.{AppConf, AppSettingsService}
import com.directv.hw.hadoop.files.{ComponentFS, LocalFsFactory}
import com.directv.hw.hadoop.http.client.HttpDispatcher
import ro.fortsoft.pf4j.PluginDescriptor
import scaldi.{Injector, Module}

class AdminDiModule(implicit coreInjector: Injector) extends Module {
  bind [AppConf] to inject[AppConf]
  bind [PluginDescriptor] to inject[DapPluginManager].getPluginDescriptor(getClass)
  bind [LocalFsFactory] to inject[LocalFsFactory]
  bind [AppSettingsService] to inject[AppSettingsService]
  bind [HttpDispatcher] to inject[HttpDispatcher]
}
