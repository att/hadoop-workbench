package com.directv.hw.hadoop.oozie.service

import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.model.{ModuleFile, ModuleFileCommon}
import com.typesafe.scalalogging.LazyLogging
import org.apache.commons.configuration.CompositeConfiguration
import scaldi.{Injectable, Injector}

import scala.language.postfixOps
import scala.util.Try


class OoziePropertyRendererImpl(fileService: ComponentFS,
                                initialConfiguration: CompositeConfiguration = new CompositeConfiguration,
                                dir: String = ModuleFileCommon.root)
                               (implicit injector: Injector) extends OoziePropertyRenderer with Injectable with LazyLogging {

  private val converter = inject[OozieFilesConverter]
  private lazy val configuration = loadProperties(initialConfiguration.clone().asInstanceOf[CompositeConfiguration], dir)

  override def renderProperty(property: String): String = {
    if (property contains '$') {
      Try {
        val surrogatePropertyName = "__pseudo_name"
        configuration.setProperty(surrogatePropertyName, property)
        configuration.getString(surrogatePropertyName)
      } recover {
        case e: Exception =>
          logger.error(s"Cannot resolve property $property", e)
          property
      } get
    } else {
      property
    }
  }

  override def addProperties(dir: String): OoziePropertyRenderer = {
    new OoziePropertyRendererImpl(fileService, configuration, dir)
  }


  private def loadProperties(configuration: CompositeConfiguration, dir: String): CompositeConfiguration = {
    val propertyFiles = resolvePropertyFiles(dir)

    val properties = propertyFiles flatMap { file =>
      val path = file.path
      Try {
        if (path endsWith "xml") {
          converter.parseConfig(fileService.getFileContent(path))
        } else if (path endsWith "properties") {
          converter.toProperties(fileService.getFileContent(path))
        } else {
          List.empty
        }
      } recover {
        case e: Exception =>
          logger.error(s"Could not read property file $path", e)
          List.empty
      } get
    }

    val propsConfig = new CompositeConfiguration()
    properties foreach { entry =>
      propsConfig.setProperty(entry.key, entry.value)
    }
    propsConfig
  }

  private def resolvePropertyFiles(dir: String): List[ModuleFile] = {
    List(OozieFiles.fileConfigDefault, OozieFiles.fileJobProperties, OozieFiles.jobConfigXml) flatMap { fileName =>
      fileService.findFile(ModuleFileCommon.concat(dir, fileName))
    }
  }

}
