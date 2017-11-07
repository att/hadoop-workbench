package com.directv.hw.web.tenant.scaldi

import akka.actor.ActorSystem
import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.core.plugin.DapPluginManager
import com.directv.hw.hadoop.deployment.DeploymentService
import com.directv.hw.hadoop.template.service.TenantService
import ro.fortsoft.pf4j.PluginDescriptor
import scaldi.{Injector, Module}

class TenantModule(implicit injector: Injector) extends Module {
  bind [PluginDescriptor] to inject[DapPluginManager].getPluginDescriptor(getClass)
  bind [TenantService] to inject[TenantService]
  bind [DeploymentService] to inject[DeploymentService]
  bind [ActorSystem] to inject[ActorSystem]
  bind [DispatcherFactory] to inject[DispatcherFactory]
}
