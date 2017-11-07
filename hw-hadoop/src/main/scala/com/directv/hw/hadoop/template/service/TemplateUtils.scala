package com.directv.hw.hadoop.template.service

import java.nio.file.{Files, Path}

import com.directv.hw.common.io.DapIoUtils._
import com.directv.hw.common.web.CommonJsonFormats
import com.directv.hw.hadoop.model.MetaFile
import com.directv.hw.hadoop.template.model.ComponentDescriptor
import org.apache.commons.io.IOUtils
import spray.json._

import scala.collection.JavaConverters._

object TemplateUtils extends CommonJsonFormats {
  import MetaFile._

  def readTemplateDescriptor(dir: Path): Option[ComponentDescriptor] = {
    val descriptorFile = dir.resolve(compDescPath)
    if (Files.exists(descriptorFile)) {
      val json = managed2(Files.newInputStream(descriptorFile)) { is =>
        IOUtils.readLines(is).asScala.mkString("\n")
      }
      Some(json.parseJson.convertTo[ComponentDescriptor])
    } else {
      None
    }
  }

  def writeTemplateDescriptor(dir: Path, descriptor: ComponentDescriptor): Unit = {
    val descriptorFile = dir.resolve(compDescPath)
    ensureDirExists(descriptorFile.getParent.toFile)
    managed2(Files.newOutputStream(descriptorFile)) { os =>
      val text = descriptor.toJson.prettyPrint
      IOUtils.write(text.getBytes(charset), os)
    }
  }
}
