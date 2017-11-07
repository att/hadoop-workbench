package com.directv.hw.web.provision

import akka.actor.ActorSystem
import com.directv.hw.core.plugin.DapPluginManager
import com.directv.hw.core.service.AppConf
import ro.fortsoft.pf4j.PluginDescriptor
import scaldi.{Injector, Module}

class DiModule(implicit coreInjector: Injector) extends Module {
  bind[ActorSystem] to inject[ActorSystem]
  bind[AppConf] to inject[AppConf]
  bind[PluginDescriptor] to inject[DapPluginManager].getPluginDescriptor(getClass)
}
