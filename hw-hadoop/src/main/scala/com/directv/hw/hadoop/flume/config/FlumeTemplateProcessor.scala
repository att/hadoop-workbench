package com.directv.hw.hadoop.flume.config

import com.directv.hw.hadoop.config.{AbstractTemplateProcessor, FlumeConfigurationProcessor, RenderingErrors, RenderingResult}
import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.files.exception.NotFoundException
import com.directv.hw.hadoop.flume.converter.FlumeConverter
import com.directv.hw.hadoop.flume.model.{FlumeChannel, FlumeNode, FlumeSink, FlumeSource}
import com.directv.hw.hadoop.flume.service.FlumeFiles
import com.directv.hw.hadoop.model.{ClusterPath, ModulePath}
import scaldi.{Injectable, Injector}

import scala.concurrent.Future
import scala.language.postfixOps

class FlumeTemplateProcessor(implicit injector: Injector)
  extends AbstractTemplateProcessor with FlumeConfigurationProcessor with Injectable {

  private val converter = inject[FlumeConverter]

  override def renderFiles(fileSystem: ComponentFS, modulePath: ModulePath): RenderingErrors = {
    val errors = super.renderFiles(fileSystem, modulePath)
    val mustacheRenderingErrors = renderFlumeConfig(fileSystem, modulePath)
    RenderingErrors(mustacheRenderingErrors ::: errors.messages)
  }

  override def updateConfiguration(clusterPath: ClusterPath, user: String): Future[Unit] = ???

  private def renderFlumeConfig(fileSystem: ComponentFS, modulePath: ModulePath): List[String] = {
    try {
      val flumeConfig = fileSystem.getFileContent(FlumeFiles.flumeConf)
      val properties = converter.toFlumePipeline(flumeConfig)
      val attributes = mustacheDictionary.attributes(modulePath)

      val renderingSourcesResults = renderNodes(properties.sources, attributes)
      val renderingChannelsResults = renderNodes(properties.channels, attributes)
      val renderingSinksResults = renderNodes(properties.sinks, attributes)

      val renderedSources = renderingSourcesResults.map(_.rendered)
      val renderedChannels = renderingChannelsResults.map(_.rendered)
      val renderedSinks = renderingSinksResults.map(_.rendered)

      val renderedProps = properties.copy(sources = renderedSources, channels = renderedChannels, sinks = renderedSinks)
      val renderedText = converter.toTextConfig(renderedProps)
      fileSystem.saveFileContent(FlumeFiles.flumeConf, renderedText)

      renderingSourcesResults.flatMap(_.errors) :::
        renderingChannelsResults.flatMap(_.errors) :::
        renderingSinksResults.flatMap(_.errors)

    } catch {
      case _: NotFoundException => List.empty // nothing to render
      case _: Exception => List("Failed to render mustache properties")
    }
  }

  private def renderNodes[T <: FlumeNode](nodes: List[T], attributes: Map[String, () => Option[String]]): List[RenderingResult[T]] = {
    nodes.map { node =>
      val renderingResults = node.properties.map { property =>
        val renderedValue = renderText(property._2, attributes)
        (property._1, renderedValue)
      }

      val renderedProperties = renderingResults.map(entry => (entry._1, entry._2.rendered))
      val missing = renderingResults.flatMap(enty => enty._2.errors).toList

      val renderedNode = node match {
        case source: FlumeSource => source.copy(properties = renderedProperties)
        case channel: FlumeChannel => channel.copy(properties = renderedProperties)
        case sink: FlumeSink => sink.copy(properties = renderedProperties)
      }

      RenderingResult(renderedNode.asInstanceOf[T], missing)
    }
  }
}
