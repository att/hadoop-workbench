package com.directv.hw.web.ingest.oozie.scaldi

import akka.actor.ActorSystem
import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.core.plugin.DapPluginManager
import com.directv.hw.core.service.{AppConf, HadoopServiceRegistry, PropertyService}
import com.directv.hw.hadoop.oozie.service._
import ro.fortsoft.pf4j.PluginDescriptor
import scaldi.{Injector, Module}

class OozieModule(implicit injector: Injector) extends Module {

  bind[AppConf] to inject[AppConf]
  bind[ActorSystem] to inject[ActorSystem]
  bind[PluginDescriptor] to inject[DapPluginManager].getPluginDescriptor(getClass)
  bind[WorkflowWebConverter] to inject[WorkflowWebConverter]
  bind[HadoopServiceRegistry] to inject[HadoopServiceRegistry]
  bind[OozieRuntimeService] to inject[OozieRuntimeService]
  bind[OozieLogService] to inject[OozieLogService]
  bind[OozieMetaDataService] to inject[OozieMetaDataService]
  bind[OozieService] to inject[OozieService]
  bind[OozieDeploymentContentServiceFactory] to inject[OozieDeploymentContentServiceFactory]
  bind[OozieComponentContentServiceFactory] to inject[OozieComponentContentServiceFactory]
  bind[DispatcherFactory] to inject[DispatcherFactory]
}
