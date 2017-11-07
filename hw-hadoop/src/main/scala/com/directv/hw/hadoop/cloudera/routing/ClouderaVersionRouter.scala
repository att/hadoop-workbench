package com.directv.hw.hadoop.cloudera.routing

import com.directv.hw.hadoop.cloudera.service.ClouderaClient
import com.directv.hw.persistence.entity.ApiEntity

trait ClouderaVersionRouter {
  def findClient(version: String, api: ApiEntity): ClouderaClient
}
