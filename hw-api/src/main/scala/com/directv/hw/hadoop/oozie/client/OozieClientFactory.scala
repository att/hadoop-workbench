package com.directv.hw.hadoop.oozie.client

import ro.fortsoft.pf4j.ExtensionPoint

trait OozieClientFactory extends ExtensionPoint {
  def getOozieClient(config: OozieSimpleClientConfig): OozieClient
  def getKrbOozieClient(config: OozieKrbClientConfig): OozieClient
}
