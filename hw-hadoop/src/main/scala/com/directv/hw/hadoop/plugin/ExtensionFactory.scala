package com.directv.hw.hadoop.plugin

import com.directv.hw.core.exception.DapInitializationException
import com.directv.hw.core.plugin.DapPluginManager
import com.typesafe.scalalogging.LazyLogging
import ro.fortsoft.pf4j.ExtensionPoint
import scaldi.{Injectable, Injector}

import scala.reflect.ClassTag

abstract class ExtensionFactory[Extension <: ExtensionPoint](implicit injector: Injector, tag: ClassTag[Extension])
  extends LazyLogging with Injectable {

  val pluginManager: DapPluginManager = inject[DapPluginManager]

  @throws[DapInitializationException]
  lazy val serviceExtension: Extension = {
    val descriptors = pluginManager.getExtensionWrappers[Extension]
    if (descriptors.isEmpty) {
      throw new DapInitializationException("service plugin extension was not found: " + tag.runtimeClass.getName)
    }

    if (descriptors.size > 1) {
      throw new DapInitializationException("found more than one plugin extension: " + tag.runtimeClass.getName)
    }

    val clazz = descriptors.head.getExtensionClass.asInstanceOf[Class[Extension]]
    logger.debug(s"found plugin service extension ${clazz.getName}")
    val constructor = clazz.getConstructor(classOf[Injector])
    val instance = constructor.newInstance(injector)
    logger.debug(s"created instance of ${clazz.getName} service extension")
    instance
  }
}
