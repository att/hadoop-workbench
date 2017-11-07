package com.directv.hw.hadoop.model

object ModuleFileCommon {
  val separator = "/"
  val root = separator

  val file = "file"
  val dir = "dir"

  val sizeUnknown  = -1

  def concat(prefix: String, file: String) = {
    if(prefix.isEmpty) {
      file
    } else {
      val normalizedPrefix = if(prefix endsWith separator) prefix else prefix + separator
      normalizedPrefix + file
    }
  }

  def name(fileName: String) = {
    if(fileName.indexOf(separator) >= 0) {
      fileName.substring(fileName.lastIndexOf(separator) + 1)
    } else {
      fileName
    }
  }
}

object WebModuleFileCommon {
  def toWebFile(file: ModuleFile) = {
    WebModuleFile(toWebPath(file.path), file.`type`, getWebFileSize(file))
  }

  def toWebPath(path: String) = {
    if(path startsWith ModuleFileCommon.separator) {
      path
    } else {
      ModuleFileCommon.separator + path
    }
  }

  def getWebFileSize(file: ModuleFile) = {
    if(file.`type` == ModuleFileCommon.file && file.size > 0) {
      Some(file.size)
    } else {
      None
    }
  }
}

case class ModuleFile(path: String, `type`: String, size: Long, modificationTime: Option[Long] = None)

case class ModuleFiles(files: List[ModuleFile])
