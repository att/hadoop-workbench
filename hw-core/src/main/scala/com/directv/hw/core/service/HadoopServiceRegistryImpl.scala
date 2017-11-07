package com.directv.hw.core.service

import com.directv.hw.hadoop.platform.model.ServiceType
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injector, Injectable}

import scala.collection._

class HadoopServiceRegistryImpl(implicit injector: Injector) extends HadoopServiceRegistry with Injectable with LazyLogging {
  private val registeredTypes = new mutable.ListBuffer[ServiceType]

  override def registerType(`type`: String, versions: Option[List[String]]) = {
    registeredTypes += ServiceType(`type`, `type`.toLowerCase, versions)
  }

  override def getRegisteredTypes = registeredTypes.toList
}
