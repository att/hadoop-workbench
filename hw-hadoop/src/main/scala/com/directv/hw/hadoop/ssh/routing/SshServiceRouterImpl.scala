package com.directv.hw.hadoop.ssh.routing

import com.directv.hw.core.plugin.DapPluginManager
import com.directv.hw.hadoop.ssh.plugin.RemoteAccessServiceFactory
import com.directv.hw.hadoop.ssh.service.RemoteAccessService
import scaldi.{Injectable, Injector}

class SshServiceRouterImpl(implicit injector: Injector) extends RemoteAccessServiceRouter with Injectable {

  val pluginManager = inject[DapPluginManager]
  val extensions = pluginManager.getExtensions(classOf[RemoteAccessServiceFactory])
  assert(extensions.size() == 1, s"should be 1 SSH extension but was ${extensions.size()}")
  val serviceFactory = extensions.get(0)

  override def getKeyBasedService(host: String, port: Int, user: String, keyPath: String): RemoteAccessService = {
    serviceFactory.getCertBasedService(host, port, user, keyPath)
  }

  override def getPassBasedService(host: String, port: Int, user: String, password: String): RemoteAccessService = {
    serviceFactory.getPassBasedService(host, port, user, password)
  }
}
