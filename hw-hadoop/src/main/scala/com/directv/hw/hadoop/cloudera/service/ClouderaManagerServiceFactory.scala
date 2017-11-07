package com.directv.hw.hadoop.cloudera.service

import com.directv.hw.core.plugin.hadoop.ServiceExtension
import com.directv.hw.hadoop.cloudera.ClouderaConnectionData

trait ClouderaManagerServiceFactory extends ServiceExtension {
  def getClouderaClient(connectionData: ClouderaConnectionData): ClouderaClient
}
