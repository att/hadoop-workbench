package com.directv.hw.persistence.dao

import com.directv.hw.hadoop.template.model.UpdateTemplateInfo
import com.directv.hw.persistence.entity.TemplateInfoEntity

trait TemplateDao[TE] {

  def getAllTemplates: List[(TemplateInfoEntity, TE)]

  def findTemplates(tenantId: Int): List[(TemplateInfoEntity, TE)]

  def getTemplate(id: Int): (TemplateInfoEntity, TE)

  def createTemplate(info: TemplateInfoEntity, entity: TE): Int

  def updateTemplate(info: TemplateInfoEntity, entity: TE)

  def updateInfo(id: Int, info: UpdateTemplateInfo): Unit

  def deleteTemplate(id: Int)
}
