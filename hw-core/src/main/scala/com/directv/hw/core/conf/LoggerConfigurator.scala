package com.directv.hw.core.conf

import java.io.File
import java.nio.file.{Paths, Files}

import ch.qos.logback.classic.LoggerContext
import ch.qos.logback.classic.joran.JoranConfigurator
import ch.qos.logback.core.joran.spi.JoranException
import com.directv.hw.core.exception.DapInitializationException
import org.slf4j.LoggerFactory

trait LoggerConfigurator {
  def initLogConfiguration(confDir: String): Unit
}

class LoggerConfiguratorImpl() extends LoggerConfigurator {

  override def initLogConfiguration(confDir: String) = {
    val logConfig = "logback.xml"
    val defaultPath = confDir + File.separator + logConfig
    val logConfPathOpt = if (Files.exists(Paths.get(defaultPath))) {
      Some(defaultPath)
    } else {
      Option(getClass.getClassLoader.getResource(logConfig)).map(_.getFile)
    }

    if (logConfPathOpt.isEmpty) {
      throw new DapInitializationException(s"Logback config was not found, should be in $defaultPath or classpath")
    }

    val logConfPath = logConfPathOpt.get
    println(s"""
         |===========================================================================================================
         | Re-initializing logback with config - $logConfPath
         |===========================================================================================================
         |""".stripMargin)

    val loggerContext = LoggerFactory.getILoggerFactory.asInstanceOf[LoggerContext]
    try {
      val configurator = new JoranConfigurator
      configurator.setContext(loggerContext)
      loggerContext.reset()
      configurator.doConfigure(logConfPath)
    } catch {
      case e: JoranException =>
        throw new DapInitializationException(s"Logback init exception ${e.getMessage}")
    }
  }
}
