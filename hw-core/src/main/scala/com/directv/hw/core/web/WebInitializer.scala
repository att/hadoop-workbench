package com.directv.hw.core.web

import javax.servlet.ServletContextEvent
import akka.util.Switch
import com.mchange.v2.c3p0.PooledDataSource
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}


class WebInitializer extends spray.servlet.Initializer with Injectable with LazyLogging {
  private val booted = new Switch(false)

  override def contextInitialized(servletContextEvent: ServletContextEvent): Unit = {
    booted switchOn {
      super.contextInitialized(servletContextEvent)
    }
  }

  override def contextDestroyed(servletContextEvent: ServletContextEvent): Unit = {
    booted switchOff {
      super.contextDestroyed(servletContextEvent)
      val context = servletContextEvent.getServletContext
      implicit val diContext: Injector = context.getAttribute(classOf[Injector].getName).asInstanceOf[Injector]
      inject[PooledDataSource].close()

      try {
        com.mysql.jdbc.AbandonedConnectionCleanupThread.shutdown()
      } catch {
        case e: Exception => logger.error("AbandonedConnectionCleanupThread shutting down", e)

      }

      val drivers = java.sql.DriverManager.getDrivers
      while (drivers.hasMoreElements) {
        val driver = drivers.nextElement()
        try {
          java.sql.DriverManager.deregisterDriver(driver)
        } catch {
          case e: Exception => logger.error("DB driver unregistering", e)
        }
      }

      Thread.sleep(2000)
    }
  }
}
