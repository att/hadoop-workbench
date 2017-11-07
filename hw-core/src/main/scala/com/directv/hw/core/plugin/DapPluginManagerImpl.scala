package com.directv.hw.core.plugin

import java.io.File
import com.directv.hw.core.exception.{CalleeException, DapPluginException, InitializationException}
import com.typesafe.scalalogging.LazyLogging
import ro.fortsoft.pf4j._
import scala.collection.JavaConversions._
import scala.reflect.ClassTag

class DapPluginManagerImpl(pluginDir: String) extends DefaultPluginManager(new File(pluginDir)) with DapPluginManager
  with LazyLogging {

  logger.info(s"Plugin directory: $pluginDir")

  if(!new File(pluginDir).exists()) {
    logger.error(s"Pluging Directory not found: '$pluginDir'")
    throw new InitializationException(s"Pluging Directory not found: '$pluginDir'")
  }

  private lazy val classpath: PluginClasspath = {
    getRuntimeMode match {
      case RuntimeMode.DEVELOPMENT => new DapPluginClasspath
      case _ => new PluginClasspath
    }
  }

  override def getPluginDescriptor(clazz: Class[_]) = findWrapper(clazz).getDescriptor

  override def createPluginDescriptorFinder = new ManifestPluginDescriptorFinder(classpath)

  override def createPluginClasspath = classpath

  override def getExtension[T](pluginId: String, extensionClass: Class[T]): T = {
    val extensions = getExtensions(extensionClass).toList
    extensions.find(ex => findWrapper(ex.getClass).getPluginId == pluginId).getOrElse (
      throw new CalleeException(s"plugin extension [${extensionClass.getName}] was not found for plugin with id [$pluginId]")
    )
  }

  override def getExtensionWrappers[T](implicit tag: ClassTag[T]): List[ExtensionDescriptor] = {
    val clazz = tag.runtimeClass.asInstanceOf[Class[T]]
    extensionFinder.find(clazz).toList.map(_.getDescriptor)
  }

  private def findWrapper(clazz: Class[_]) = {
    val plugin = whichPlugin(clazz)
    if (plugin == null) throw new DapPluginException(s"Couldn't find plugin wrapper for class - $clazz")
    plugin
  }
}
