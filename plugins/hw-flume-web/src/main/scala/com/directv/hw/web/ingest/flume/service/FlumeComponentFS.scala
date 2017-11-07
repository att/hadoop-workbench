package com.directv.hw.web.ingest.flume.service

import java.io.{ByteArrayInputStream, InputStream}

import com.directv.hw.core.exception.ServerError
import com.directv.hw.core.service.Overwrite
import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.flume.service.{FlumeFiles, FlumeService}
import com.directv.hw.hadoop.model.{ModuleFile, ModuleFileCommon, RelativeModulePath}
import org.apache.commons.io.IOUtils

class FlumeComponentFS(flume: FlumeService, modulePath: RelativeModulePath, fs: ComponentFS)
    extends ComponentFS {

  override def listFiles(from: String, includeDirectories: Boolean, depth: Int): List[ModuleFile] = {
    val regularFiles = fs.listFiles(from, includeDirectories, depth)
    if (FlumeFiles.flumeConf startsWith from) {
      regularFiles :+ ModuleFile(FlumeFiles.flumeConf, ModuleFileCommon.file, ModuleFileCommon.sizeUnknown)
    } else {
      regularFiles
    }
  }

  override def readFile(file: String): InputStream = {
    if (isRegular(file)) {
      fs.readFile(file)
    } else {
      new ByteArrayInputStream(textConfig().getBytes(defaultCharset))
    }
  }

  override def getFileContent(file: String): String = {
    if (isRegular(file)) {
      fs.getFileContent(file)
    } else {
      textConfig()
    }
  }

  override def saveFileContent(file: String, content: String, overwrite: Overwrite = Overwrite.OVERWRITE) = {
    if (isRegular(file)) {
      fs.saveFileContent(file, content, overwrite)
    } else if (overwrite == Overwrite.OVERWRITE) {
      saveTextConfig(content)
    }
  }

  override def writeFile(file: String, is: InputStream, overwrite: Overwrite = Overwrite.OVERWRITE) = {
    import scala.collection.JavaConverters._

    if (isRegular(file)) {
      fs.writeFile(file, is, overwrite)
    } else {
      val textConfig = IOUtils.readLines(is, defaultCharset).asScala mkString "\n"
      saveTextConfig(textConfig)
    }
  }

  override def createDir(dir: String) = {
    ensureRegular(dir)
    fs.createDir(dir)
  }

  override def move(file: String, to: String, overwrite: Overwrite = Overwrite.OVERWRITE) = {
    ensureRegular(file)
    ensureRegular(to)
    fs.move(file, to, overwrite)
  }

  override def delete(file: String) = {
    ensureRegular(file)
    fs.delete(file)
  }

  private def textConfig() = flume.getPipelineConfig(modulePath)

  private def saveTextConfig(text: String) = flume.updatePiplelineConfig(modulePath, text)

  private def isRegular(file: String) = file != FlumeFiles.flumeConf

  private def ensureRegular(file: String) = {
    if (!isRegular(file)) throw new ServerError(s"File [$file] cannot be accessed this way")
  }

  override def tryFileContent(path: String): Option[String] = fs.tryFileContent(path)

  override def createBaseDir(): Boolean = fs.createBaseDir()
}


