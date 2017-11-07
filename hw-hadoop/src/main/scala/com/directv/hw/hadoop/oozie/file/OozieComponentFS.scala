package com.directv.hw.hadoop.oozie.file

import java.io.InputStream
import com.directv.hw.core.service.{ComponentLocalFS, Overwrite}
import com.directv.hw.hadoop.files.ComponentFS
import OozieComponentFS._

private[file] object OozieComponentFS {
  val appPathPrefix = "${wf:conf('oozie.wf.application.path')}/"
  def apply(fs: ComponentFS): ComponentFS = new OozieComponentFS(fs)
}

private class OozieComponentFS(fs: ComponentFS) extends ComponentFS {

  override def listFiles(from: String, includeDirectories: Boolean, depth: Int) = {
    fs.listFiles(from, includeDirectories, depth)
  }

  override def getFileContent(file: String): String = {
    fs.getFileContent(fixFilePath(file))
  }

  override def readFile(file: String) = fs.readFile(fixFilePath(file))

  override def saveFileContent(file: String, content: String, overwrite: Overwrite) = {
    fs.saveFileContent(fixFilePath(file), content, overwrite)
  }

  override def writeFile(file: String, is: InputStream, overwrite: Overwrite)= {
    fs.writeFile(fixFilePath(file), is, overwrite)
  }

  override def createDir(dir: String) = fs.createDir(fixFilePath(dir))

  override def move(file: String, to: String, overwrite: Overwrite) = {
    fs.move(fixFilePath(file), fixFilePath(to), overwrite)
  }

  override def delete(file: String): Unit = fs.delete(fixFilePath(file))

  private def fixFilePath(file: String): String = file.replace(appPathPrefix, "")

  override def tryFileContent(path: String): Option[String] = fs.tryFileContent(path)

  override def createBaseDir(): Boolean = fs.createBaseDir()
}
