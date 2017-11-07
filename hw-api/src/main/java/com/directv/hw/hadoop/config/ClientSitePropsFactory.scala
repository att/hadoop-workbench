package com.directv.hw.hadoop.config

import com.directv.hw.hadoop.model.ClusterPath

trait ClientSitePropsFactory {
  def getClientSiteProps(clusterPath: ClusterPath): ClientSiteProps
}
