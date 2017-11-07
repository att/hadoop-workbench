package com.directv.hw.hadoop.ssh.routing

import com.directv.hw.hadoop.ssh.service.RemoteAccessService

trait RemoteAccessServiceRouter {
  def getKeyBasedService(host: String, port: Int, user: String, privateKey: String): RemoteAccessService
  def getPassBasedService(host: String, port: Int, user: String, password: String): RemoteAccessService
}
