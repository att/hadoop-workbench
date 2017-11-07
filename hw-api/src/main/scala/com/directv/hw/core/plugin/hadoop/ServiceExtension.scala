package com.directv.hw.core.plugin.hadoop

import ro.fortsoft.pf4j.ExtensionPoint

trait ServiceExtension extends ExtensionPoint {
  def init() = {}
}
