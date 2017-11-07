package com.directv.hw.core.plugin

import ro.fortsoft.pf4j.PluginClasspath

object DapPluginClasspath {
  private val classesDir: String = "target/plugin-classes"
  private val libDir: String = "target/lib"
}

class DapPluginClasspath extends PluginClasspath {

  import DapPluginClasspath._

  protected override def addResources() {
    classesDirectories.add(classesDir)
    libDirectories.add(libDir)
  }

}
