package com.directv.hw.web.listing.scaldi

import akka.actor.{ActorRef, ActorSystem}
import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.core.plugin.DapPluginManager
import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.access.AccessManagerService
import com.directv.hw.hadoop.config.ClusterServiceResolver
import com.directv.hw.hadoop.di.DiReferences
import com.directv.hw.hadoop.flume.cache.FlumeUpdateActorHolder
import com.directv.hw.hadoop.flume.routing.FlumeServiceRouter
import com.directv.hw.hadoop.flume.service.FlumeLocalRepo
import com.directv.hw.hadoop.hdfs.HdfsServiceFactory
import com.directv.hw.hadoop.oozie.service.{OozieDeploymentService, OozieRuntimeService}
import com.directv.hw.hadoop.platform.PlatformMetadataService
import com.directv.hw.hadoop.platform.service.{ClusterInstallationService, PlatformManager}
import com.directv.hw.hadoop.platform.status.PlatformStatusService
import ro.fortsoft.pf4j.PluginDescriptor
import scaldi.{Injector, Module}

class PlatformModule(implicit injector: Injector) extends Module {
  bind [AppConf] to inject[AppConf]
  bind [PluginDescriptor] to inject[DapPluginManager].getPluginDescriptor(getClass)
  bind [PlatformManager] to inject[PlatformManager]
  bind [AccessManagerService] to inject[AccessManagerService]
  bind [PlatformStatusService] to inject[PlatformStatusService]
  bind [FlumeServiceRouter] to inject[FlumeServiceRouter]
  bind [FlumeLocalRepo] to inject[FlumeLocalRepo]
  bind [OozieDeploymentService] to inject[OozieDeploymentService]
  bind [HdfsServiceFactory] to inject[HdfsServiceFactory]
  bind [OozieRuntimeService] to inject[OozieRuntimeService]
  bind [PlatformMetadataService] to inject[PlatformMetadataService]
  bind [FlumeUpdateActorHolder] to inject[FlumeUpdateActorHolder]
  bind [ClusterInstallationService] to inject[ClusterInstallationService]
  bind [ClusterServiceResolver] to inject[ClusterServiceResolver]
  bind [DispatcherFactory] to inject[DispatcherFactory]

  private lazy val actorSystem = inject[ActorSystem]
  bind [ActorSystem] to actorSystem
  bind [ActorRef] as DiReferences.oozieIndexer to inject[ActorRef](DiReferences.oozieIndexer)
}
