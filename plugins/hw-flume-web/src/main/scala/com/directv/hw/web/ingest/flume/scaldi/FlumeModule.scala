package com.directv.hw.web.ingest.flume.scaldi

import com.directv.hw.core.plugin.DapPluginManager
import com.directv.hw.core.service.{AppConf, HadoopServiceRegistry, PropertyService}
import com.directv.hw.hadoop.access.AccessManagerService
import com.directv.hw.hadoop.config.FlumeConfigurationProcessor
import com.directv.hw.hadoop.flume.converter.FlumeConverter
import com.directv.hw.hadoop.flume.routing.FlumeServiceRouter
import com.directv.hw.hadoop.flume.service.FlumeLocalRepo
import com.directv.hw.hadoop.metrics.MetricsAssignmentRepo
import com.directv.hw.hadoop.platform.service.PlatformManager
import com.directv.hw.hadoop.template.injest.flume.service.{FlumeElementTenantRepo, FlumeTenantRepo}
import com.directv.hw.web.ingest.flume.converter.{FlumeWebConverter, FlumeWebConverterImpl}
import com.directv.hw.web.ingest.flume.service.{FlumePersistenceService, FlumePersistenceServiceImpl, FlumeTemplatePersistenceService, FlumeTemplatePersistenceServiceImpl}
import ro.fortsoft.pf4j.PluginDescriptor
import scaldi.{Injector, Module}

class FlumeModule(implicit injector: Injector) extends Module {
  bind [FlumeServiceRouter] to inject[FlumeServiceRouter]
  bind [PropertyService] to inject[PropertyService]
  bind [PlatformManager] to inject[PlatformManager]
  bind [FlumeConfigurationProcessor] to inject[FlumeConfigurationProcessor]

  private lazy val descriptor = inject[DapPluginManager].getPluginDescriptor(getClass)
  bind [FlumePersistenceService] to new FlumePersistenceServiceImpl(inject[PropertyService], descriptor.getPluginId)
  bind [PluginDescriptor] to  descriptor
  bind [FlumeTenantRepo] to inject[FlumeTenantRepo]
  bind [FlumeElementTenantRepo] to inject[FlumeElementTenantRepo]
  bind [FlumeLocalRepo] to inject[FlumeLocalRepo]
  bind [HadoopServiceRegistry] to inject[HadoopServiceRegistry]
  bind [FlumeTemplatePersistenceService] to new FlumeTemplatePersistenceServiceImpl(inject[PropertyService])
  bind [FlumeConverter] to inject[FlumeConverter]
  bind [FlumeWebConverter] to new FlumeWebConverterImpl
  bind [AccessManagerService] to inject[AccessManagerService]
  bind [AppConf] to inject[AppConf]
  bind [MetricsAssignmentRepo] to inject[MetricsAssignmentRepo]
}
