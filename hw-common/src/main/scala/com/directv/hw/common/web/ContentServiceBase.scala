package com.directv.hw.common.web

import java.io.InputStream

import com.directv.hw.core.exception.NotSupportedException
import com.directv.hw.core.service.Overwrite
import com.directv.hw.hadoop.files.{ComponentFS, ContentService}
import com.directv.hw.hadoop.model.{ModuleFile, ModulePath}

abstract class ContentServiceBase extends ContentService {

  protected val fileService: ComponentFS

  override def listFiles(from: String, includeDirectories: Boolean, depth: Int): List[ModuleFile] = {
    fileService.listFiles(from, includeDirectories, depth)
  }

  override def getBinaryFile(file: String): InputStream = {
    fileService.readFile(file)
  }

  override def saveBinaryFile(file: String, is: InputStream, overwrite: Overwrite): Unit = {
    fileService.writeFile(file, is, overwrite)
  }

  override def delete(file: String): Unit = {
    fileService.delete(file)
  }

  override def createDir(dir: String): Unit = {
    fileService.createDir(dir)
  }

  override def move(file: String, to: String, overwrite: Overwrite): Unit = {
    fileService.move(file, to, overwrite)
  }

  override def copyTo(path: ModulePath, files: List[String]): Unit = {
    throw new NotSupportedException("copyTo is not implemented for this component")
  }

  override def copyTo(templateId: Int, files: List[String]): Unit = {
    throw new NotSupportedException("copyTo is not implemented for this component")
  }

  protected def copyFIles(from: ComponentFS, to: ComponentFS, files: List[String]): Unit = {
    files.foreach { file =>
      val is = from.readFile(file)
      to.writeFile(file, is)
    }
  }
}