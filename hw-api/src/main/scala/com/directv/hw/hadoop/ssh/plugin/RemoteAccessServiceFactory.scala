package com.directv.hw.hadoop.ssh.plugin

import com.directv.hw.core.plugin.hadoop.ServiceExtension
import com.directv.hw.hadoop.ssh.service.RemoteAccessService

trait RemoteAccessServiceFactory extends ServiceExtension {
  def getCertBasedService(host: String, port: Int, user: String, privateKey: String): RemoteAccessService
  def getPassBasedService(host: String, port: Int, user: String, privateKey: String): RemoteAccessService
}
