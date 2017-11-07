package com.directv.hw.core.plugin

import ro.fortsoft.pf4j.{ExtensionDescriptor, PluginDescriptor, PluginManager}

import scala.reflect.ClassTag

trait DapPluginManager extends PluginManager {
  def getPluginDescriptor(clazz: Class[_]): PluginDescriptor
  def getExtension[T](pluginId: String, extensionClass: Class[T]): T
  def getExtensionWrappers[T](implicit tag: ClassTag[T]): List[ExtensionDescriptor]
}
