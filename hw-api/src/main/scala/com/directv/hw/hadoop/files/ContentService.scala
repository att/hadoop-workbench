package com.directv.hw.hadoop.files

import java.io.InputStream

import com.directv.hw.core.service.Overwrite
import com.directv.hw.hadoop.files.exception.NotFoundException
import com.directv.hw.hadoop.model.{FileContent, ModuleFile, ModulePath, ParsedContent}

trait ContentService {
  def convert(file: String, text: String, format: String): ParsedContent
  def convert(file: String, content: ParsedContent): String

  @throws[NotFoundException]
  def getFileContent(file: String, format: Option[String]): FileContent
  def saveFileContent(file: String, content: FileContent, overwrite: Overwrite = Overwrite.OVERWRITE)

  def listFiles(from: String = ComponentFS.root,
                includeDirectories: Boolean = true,
                depth: Int = ComponentFS.unlimited): List[ModuleFile]

  def getBinaryFile(file: String): InputStream
  def saveBinaryFile(file: String, is: InputStream, overwrite: Overwrite = Overwrite.OVERWRITE)
  def createDir(dir: String)
  def move(file: String, to: String, overwrite: Overwrite = Overwrite.OVERWRITE)
  def delete(file: String)
  def copyTo(path: ModulePath, files: List[String])
  def copyTo(templateId: Int, files: List[String])
}

