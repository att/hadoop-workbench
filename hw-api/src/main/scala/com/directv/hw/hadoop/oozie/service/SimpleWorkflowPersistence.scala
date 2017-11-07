package com.directv.hw.hadoop.oozie.service

trait SimpleWorkflowPersistence {
  def deleteCoords(file: String): Unit

  def saveCoords(file: String, coords: String)

  def getCoords(file: String): Option[String]

  def displayName: String
}
