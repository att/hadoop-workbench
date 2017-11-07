package com.directv.hw.core.kamon

import com.typesafe.config.{Config, ConfigFactory}
import kamon.ConfigProvider

object KamonConfigProvider {
  var config: Config = null
}

class KamonConfigProvider extends ConfigProvider{
  override def config: Config = KamonConfigProvider.config
}
