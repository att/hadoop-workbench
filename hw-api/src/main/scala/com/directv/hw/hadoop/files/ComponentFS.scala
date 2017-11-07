package com.directv.hw.hadoop.files

import java.io.{File, InputStream}
import java.nio.charset.StandardCharsets

import com.directv.hw.core.service.Overwrite
import com.directv.hw.hadoop.files.exception.NotFoundException
import com.directv.hw.hadoop.model.ModuleFile

import scala.language.postfixOps

object ComponentFS {
  val includeDirectories = true
  val excludeDirectories = false

  val unlimited = -1
  val fileOnly = 0
  val withChildren = 1

  val root = ""
}

trait ComponentFS {
  import ComponentFS._

  protected val defaultCharset = StandardCharsets.UTF_8

  /**
   * Files including directories
 *
   * @param depth How many hierarchy levels should be returned. 
   *              <code>fileOnly</code> or <code>0</code> means this file only,
   *              <code>1</code> means file with immediate children etc
   *              <code>unlimited</code> means "fetch all"
   */
  def listFiles(from: String = root, includeDirectories: Boolean = includeDirectories, depth: Int = unlimited): List[ModuleFile]

  def createBaseDir(): Boolean

  def findFile(file: String) = listFiles(file, includeDirectories, fileOnly) headOption

  def getFile(file: String) = findFile(file) get

  def getLocalFile(file: String): File = throw new UnsupportedOperationException

  @throws[NotFoundException]
  def getFileContent(file: String): String
  def tryFileContent(path: String): Option[String]
  def readFile(file: String): InputStream
  def saveFileContent(file: String, content: String, overwrite: Overwrite = Overwrite.OVERWRITE)
  def writeFile(file: String, is: InputStream, overwrite: Overwrite = Overwrite.OVERWRITE)

  def createDir(dir: String)

  def move(file: String, to: String, overwrite: Overwrite = Overwrite.OVERWRITE)

  def delete(file: String)
}
