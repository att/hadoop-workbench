package com.directv.hw.web.ingest.flume.service

import com.directv.hw.common.web.ContentServiceBase
import com.directv.hw.core.exception.ServerError
import com.directv.hw.core.service.Overwrite
import com.directv.hw.hadoop.flume.converter.FlumeConverter
import com.directv.hw.hadoop.flume.routing.FlumeServiceRouter
import com.directv.hw.hadoop.flume.service.FlumeFiles
import com.directv.hw.hadoop.model._
import com.directv.hw.web.ingest.flume.converter.FlumeWebConverter
import com.directv.hw.web.ingest.flume.model._
import scaldi.{Injectable, Injector}

abstract class FlumeContentService(implicit injector: Injector) extends ContentServiceBase with Injectable {

  private val converter = inject[FlumeConverter]
  private val webConverter = inject[FlumeWebConverter]
  protected val flumeRouter = inject[FlumeServiceRouter]

  protected val simplePersistence: SimpleFlumePersistence

  override def convert(file: String, text: String, format: String): ParsedContent = {
    doConvert(file, text, format, None)
  }

  override def getFileContent(file: String, format: Option[String]): FileContent = {
    val fileText = fileService.getFileContent(file)
    val parsed = format map (doConvert(file, fileText, _, Some(simplePersistence)))
    FileContent(Some(fileText), parsed)
  }

  private def doConvert(file: String, text: String, format: String, persistence: Option[SimpleFlumePersistence]): ParsedContent = {
    format match {
      case FileTypes.flumeConf =>
        val model = converter.toFlumePipeline(text)
        val userData = persistence flatMap { persistence =>
          val (valid, invalid) = persistence.getPositioning partition { moduleData =>
            moduleData.hasAbsoluteCoordinates &&
            moduleData.nodeData.keySet == (model.sources ++ model.channels ++ model.sinks).map(_.name).toSet
          }
          invalid foreach (_ => persistence.deletePositioning())
          valid.headOption
        }

        webConverter.toGraph(model, userData)
      case other =>
        throw new ServerError(s"Unsupported format: $other")
    }
  }

  override def saveFileContent(file: String, content: FileContent, overwrite: Overwrite): Unit = {
    val text = content.content map (doConvert(file, _, saveUserProperties(file))) orElse content.text getOrElse (throw new ServerError(s"Content not found"))
    fileService.saveFileContent(file, text, overwrite)
  }

  override def convert(file: String, content: ParsedContent): String = {
    doConvert(file, content, _ => Unit)
  }

  private def doConvert(file: String, content: ParsedContent, withGraph: FlumeGraph => Unit): String = {
    content match {
      case graph: FlumeGraph =>
        withGraph(graph)
        val pipeline = webConverter.toFlumeAgent(graph)
        converter.toTextConfig(pipeline)
      case _ => throw new ServerError("unknown format flume config format")
    }
  }

  private def saveUserProperties(file: String): FlumeGraph => Unit = { graph =>
    if (file == FlumeFiles.flumeConf) {
      webConverter.extractUserData(graph) foreach simplePersistence.savePositioning
    }
  }
}

