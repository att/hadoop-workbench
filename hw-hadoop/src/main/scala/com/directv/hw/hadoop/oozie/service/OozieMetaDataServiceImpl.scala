package com.directv.hw.hadoop.oozie.service

import com.directv.hw.common.io.DapIoUtils
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}

class OozieMetaDataServiceImpl(implicit injector: Injector) extends OozieMetaDataService with Injectable with LazyLogging {

  private val parser = inject[OozieFilesConverter]

  private lazy val typeMetadata = DapIoUtils.loadResourceAsString(getClass, "oozie/metadata/types.json")
  private lazy val connectionsMetadata = DapIoUtils.loadResourceAsString(getClass, "oozie/metadata/connections.json")

  override def getTypeMetadata(version: String): String = typeMetadata
  override def getConnectionsMetadata(version: String): String = connectionsMetadata
  override def getSubtypeMetadata(version: String): String = parser.getSubtypeMetadata(version)
}