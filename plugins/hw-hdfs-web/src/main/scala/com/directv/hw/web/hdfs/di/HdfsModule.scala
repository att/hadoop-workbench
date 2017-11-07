package com.directv.hw.web.hdfs.di

import com.directv.hw.core.plugin.DapPluginManager
import com.directv.hw.hadoop.access.AccessManagerService
import com.directv.hw.hadoop.hdfs.HdfsServiceFactory
import ro.fortsoft.pf4j.PluginDescriptor
import scaldi.{Injector, Module}

class HdfsModule(implicit injector: Injector) extends Module {
  bind [AccessManagerService] to inject[AccessManagerService]
  bind [PluginDescriptor] to inject[DapPluginManager].getPluginDescriptor(getClass)
  bind [HdfsServiceFactory] to inject[HdfsServiceFactory]
}
