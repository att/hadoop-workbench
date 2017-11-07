package com.directv.hw.hadoop.template.injest.flume.service

import com.directv.hw.hadoop.flume.service.FlumeFiles
import com.directv.hw.hadoop.model.ComponentTypes
import com.directv.hw.hadoop.template.injest.flume.model.AgentTemplate
import com.directv.hw.hadoop.template.injest.flume.service.FlumeTenantRepo._
import com.directv.hw.hadoop.template.service.TenantRepo

object FlumeTenantRepo {
  val typeAliases = List("flume-agent")
  val flumeConfFile = FlumeFiles.flumeConf
}

trait FlumeTenantRepo extends TenantRepo[AgentTemplate] {
  override val getType = ComponentTypes.flume
  override val getTypeAliases = typeAliases
}
