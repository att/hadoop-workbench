package com.directv.hw.hadoop.flume.file

import java.io.{File, InputStream}
import com.directv.hw.core.service.{ComponentLocalFS, Overwrite}
import com.directv.hw.hadoop.model.ModulePath
import FlumeComponentLocalFS._

object FlumeComponentLocalFS {
  val pluginPath = "lib/"

  def apply(path: ModulePath, dir: File, onUpdate: (ModulePath) => Unit) = {
    new FlumeComponentLocalFS(path, dir, onUpdate)
  }
}

class FlumeComponentLocalFS(path: ModulePath, dir: File, onUpdate: (ModulePath) => Unit) extends ComponentLocalFS(dir) {

  override def writeFile(file: String, is: InputStream, overwrite: Overwrite) = {
    if(isPluginFile(file)) {
      onUpdate(path)
    }
    super.writeFile(file, is, overwrite)
  }

  override def move(file: String, to: String, overwrite: Overwrite) = {
    if(isPluginFile(file) || isPluginFile(to)) {
      onUpdate(path)
    }
    super.move(file, to, overwrite)
  }

  override def delete(file: String) = {
    if(isPluginFile(file)) {
      onUpdate(path)
    }
    super.delete(file)
  }

  private def isPluginFile(file: String) = file.startsWith(pluginPath)

}
