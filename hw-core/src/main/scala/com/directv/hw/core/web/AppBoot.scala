package com.directv.hw.core.web

import javax.servlet.ServletContext

import akka.actor.{ActorRef, ActorSystem}
import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.core.di.CoreModules
import com.directv.hw.core.plugin.DapPluginManager
import com.directv.hw.core.plugin.hadoop.ServiceExtension
import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.config.{ClusterConfigService, ClusterServiceResolver}
import com.directv.hw.hadoop.di.{HadoopDiReferences, HadoopModules}
import com.directv.hw.hadoop.flume.cache.{FlumeUpdateActor, FlumeUpdateActorHolder}
import com.directv.hw.hadoop.oozie.model.OozieIndexation.IndexAllHds
import com.directv.hw.persistence.di.PersistenceModules
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}
import spray.servlet.WebBoot

import scala.concurrent.duration._
import scala.collection.JavaConversions._
import scala.concurrent.ExecutionContext
import scala.language.postfixOps

class AppBoot(servletContext: ServletContext) extends WebBoot with Injectable with LazyLogging {

  private implicit val di: Injector = CoreModules.context :: HadoopModules.context :: PersistenceModules.context

  private val conf = inject[AppConf]

  private val pluginManager =
  try {
    val pluginManager = inject[DapPluginManager]
    pluginManager.loadPlugins()
    pluginManager.startPlugins()
    pluginManager
  } catch {
    case e: Throwable =>
      logger.error(s"exiting due to: error", e)
      System.exit(1)
      null
  }

  private val flumeUpdateActor = inject[FlumeUpdateActorHolder].actor
  private val clusterConfigService = inject[ClusterConfigService]
  private val clusterServiceResolver = inject[ClusterServiceResolver]
  private val dispatcherFactory = inject[DispatcherFactory]

  override val system: ActorSystem =
  try {
    inject[ActorSystem]
  } catch {
    case e: Throwable =>
      logger.error(s"exiting due to error", e)
      System.exit(1)
      null
  }

  private implicit val executionContext: ExecutionContext = dispatcherFactory.auxiliaryDispatcher

  override val serviceActor: ActorRef =
  try {
    inject[ActorRef]('httpService)
  } catch {
    case e: Throwable =>
      logger.error(s"exiting due to error", e)
      System.exit(1)
      null
  }

  try {
    initServiceExtensions()
    initBackgroundServices()
    initServletContext()
  }catch {
    case e: Throwable =>
      logger.error(s"exiting due to error", e)
      System.exit(1)
      null
  }

  private def initServletContext(): Unit = {
    if (servletContext != null) { // hack for running via main method
      servletContext.setAttribute(classOf[Injector].getName, di)
    }
  }

  private def initServiceExtensions(): Unit = {
    val extensions = pluginManager.getExtensions(classOf[ServiceExtension]).toList
    extensions.foreach { extension =>
      logger.debug(s"Found service extension - ${extension.getClass.getName}")
      extension.init()
      logger.debug(s"Service extension - ${extension.getClass.getName} has been initialized")
    }
  }

  private def initBackgroundServices(): Unit = {
    startHdfsIndexation()
    startClientConfigsUpdater()
  }

  def startHdfsIndexation(): Unit = {
    if (conf.startupOozieIndexation) inject[ActorRef](HadoopDiReferences.oozieIndexer) ! IndexAllHds(conf.appUser)
    else logger.debug("startup oozie workflow indexation is disabled")
  }

  private def startClientConfigsUpdater(): Unit = {
    if (conf.platformConfigUpdateSec > 0) {
      logger.debug(s"started cluster config update scheduler every ${conf.platformConfigUpdateSec} seconds")
      system.scheduler.schedule (initialDelay = 0 seconds, interval = conf.platformConfigUpdateSec seconds) {
        clusterServiceResolver.updateSeviceCacheQuietly()
      }
    }

    if (conf.flumeCacheUpdateSec > 0) {
      logger.debug(s"started flume cache update scheduler every ${conf.flumeCacheUpdateSec} seconds")

      system.scheduler.schedule (
        initialDelay = 0 seconds,
        interval = conf.flumeCacheUpdateSec seconds,
        receiver = flumeUpdateActor,
        message = FlumeUpdateActor.UpdateAllClusters
      )
    }
  }
}