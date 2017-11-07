package com.directv.hw.hadoop.ssh.plugin

import java.util
import com.directv.hw.hadoop.ssh.service.{RemoteAccessServiceImpl, RemoteAccessService}
import com.jcraft.jsch.{Session, Logger, JSch}
import com.typesafe.scalalogging.LazyLogging
import ro.fortsoft.pf4j.{Plugin, PluginWrapper, Extension}

class RemoteAccessPluginWrapper(pluginWrapper: PluginWrapper) extends Plugin(pluginWrapper)

@Extension
class RemoteAccessServiceFactoryImpl extends RemoteAccessServiceFactory {

  override def getCertBasedService(host: String, port: Int, user: String, certPath: String): RemoteAccessService = {
    val jsch: JSch = new JSch()
    JSch.setLogger(JSchLogger)
    jsch.addIdentity(certPath)

    def openSession(session: Session) = {
      val config = new util.Hashtable[String, String]()
      config.put("StrictHostKeyChecking", "no")
      session.setConfig(config)
      session.connect()
      session
    }

    new RemoteAccessServiceImpl(jsch, user, host, port, openSession)
  }

  override def getPassBasedService(host: String, port: Int, user: String, password: String): RemoteAccessService = {
    val jsch: JSch = new JSch()
    JSch.setLogger(JSchLogger)

    def openSession(session: Session) = {
      val config = new util.Hashtable[String, String]()
      config.put("StrictHostKeyChecking", "no")
      config.put("PreferredAuthentications", "password")
      session.setConfig(config)
      session.setPassword(password)
      session.connect()
      session
    }

    new RemoteAccessServiceImpl(jsch, user, host, port, openSession)
  }
}

object JSchLogger extends Logger with LazyLogging {
  override def log(level: Int, message: String): Unit = level match {
    case 0 => logger.debug(message)
    case 1 => logger.info(message)
    case 2 => logger.warn(message)
    case _ => logger.error(message)
  }
  override def isEnabled(level: Int): Boolean = level match {
    case 0 => logger.underlying.isDebugEnabled
    case 1 => logger.underlying.isInfoEnabled
    case 2 => logger.underlying.isWarnEnabled
    case _ => logger.underlying.isErrorEnabled
  }
}
