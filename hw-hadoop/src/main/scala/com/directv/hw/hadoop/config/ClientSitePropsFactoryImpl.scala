package com.directv.hw.hadoop.config

import com.directv.hw.hadoop.model.ClusterPath
import scaldi.{Injectable, Injector}

class ClientSitePropsFactoryImpl(implicit injector: Injector) extends ClientSitePropsFactory with Injectable {

  override def getClientSiteProps(clusterPath: ClusterPath): ClientSiteProps = {
    new ClientSitePropsImpl(clusterPath)
  }
}
