package com.directv.hw.hadoop.oozie.service

trait OozieMetaDataService {
  def getSubtypeMetadata(version: String): String
  def getTypeMetadata(version: String): String
  def getConnectionsMetadata(version: String): String
}