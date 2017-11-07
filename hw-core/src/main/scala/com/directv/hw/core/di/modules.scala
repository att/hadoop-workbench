package com.directv.hw.core.di

import akka.actor._
import akka.routing.FromConfig
import com.directv.hw.core.auth.{AuthService, AuthServiceImpl, LdapClient, LdapClientImpl}
import com.directv.hw.core.concurrent.{DispatcherFactory, DispatcherFactoryImpl}
import com.directv.hw.core.conf.{AppConfImpl, LoggerConfiguratorImpl}
import com.directv.hw.core.http.{RequestIdGenerator, RequestIdGeneratorImpl}
import com.directv.hw.core.kamon.KamonConfigProvider
import com.directv.hw.core.plugin._
import com.directv.hw.core.service._
import com.directv.hw.core.settings.{SettingsService, SettingsServiceImpl}
import com.directv.hw.core.web.{RestRouter, RoutedHttpService}
import com.directv.hw.hadoop.files.{ComponentFS, LocalFsFactory}
import com.directv.hw.persistence.dao._
import kamon.Kamon
import scaldi.Module

import scala.collection.JavaConversions._

object CoreModules  {
  val context = BootModule :: ServiceModule :: PluginModule
}

object BootModule extends Module {
  lazy val appConf = new AppConfImpl(System.getenv.toMap, new LoggerConfiguratorImpl)
  bind [AppConf] to appConf

  if (appConf.kamonEnabled) {
    KamonConfigProvider.config = appConf.config
    Kamon.start()
  }

  lazy val system: ActorSystem = ActorSystem("core-system", appConf.config)
  bind [ActorSystem] to system
  bind [DispatcherFactory] to new DispatcherFactoryImpl(system)

  lazy val coreRoutes = new RestRouter()
  bind [ActorRef] as 'httpService to system.actorOf(FromConfig.props(Props(new RoutedHttpService(coreRoutes.route))), "httpRouter")
  bind [RestRouter] to coreRoutes
}

object ServiceModule extends Module {
  lazy val conf = inject[AppConf]

  bind [LdapClient] to new LdapClientImpl(inject[AppConf])
  bind [AuthService] to new AuthServiceImpl
  bind [PropertyService] to new PropertyServiceImpl(inject[PropertyDao])
  bind [HadoopServiceRegistry] to new HadoopServiceRegistryImpl
  bind [SettingsService] to new SettingsServiceImpl(inject[SettingsDao])
  bind [AppSettingsService] to new AppSettingsServiceImpl()
  bind [LocalFsFactory] to new LocalFsFactoryImpl
  bind [ExternalProcessFactory] to new ExternalProcessFactoryImpl
  bind [RequestIdGenerator] to new RequestIdGeneratorImpl
}

object PluginModule extends Module {
  lazy val conf = inject[AppConf]
  bind[DapPluginManager] to new DapPluginManagerImpl(conf.pluginDir)
}



