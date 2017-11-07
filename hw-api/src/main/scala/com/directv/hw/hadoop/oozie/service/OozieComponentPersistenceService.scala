package com.directv.hw.hadoop.oozie.service

case class WorkflowTemplatePersistenceEntry(templateId: Int, file: String, userName: String, value: String)

trait OozieComponentPersistenceService {
  def findCoords(templateId: Int): List[WorkflowTemplatePersistenceEntry]

  def getCoords(templateId: Int, file: String, userName: String): String

  def saveCoords(templateId: Int, file: String, userName: String, coords: String)

  def deleteCoords(templateId: Int, file: String, userName: String)
}
