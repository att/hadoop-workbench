package com.directv.hw.hadoop.config

import com.directv.hw.core.exception.NotFoundException
import com.directv.hw.core.service.HadoopConfigNames
import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.model.{ModuleFileCommon, ModulePath}
import com.directv.hw.hadoop.platform.service.PlatformManager
import com.samskivert.mustache.Mustache
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}
import scala.language.postfixOps
import scala.util.Try
import scala.xml.{Elem, Node, Text, XML}

abstract class AbstractTemplateProcessor(implicit injector: Injector)
  extends TemplateProcessor with Injectable with LazyLogging {

  protected val platformService: PlatformManager = inject[PlatformManager]
  protected val mustacheDictionary: MustacheClusterDictionary = inject[MustacheClusterDictionary]

  protected def renderText(text: String, attributes: Map[String, () => Option[String]]): RenderingResult[String] = {
    val collector = new PropertiesCollector
    val rendered = Mustache.compiler()
      .defaultValue("")
      .withCollector(collector)
      .compile(text)
      .execute(attributes)

    RenderingResult(rendered, collector.missed.map(key => s"unknown mustache key [$key]"))
  }

  override def renderFiles(fileSystem: ComponentFS, modulePath: ModulePath): RenderingErrors = {
    val results = fileSystem.listFiles(includeDirectories = ComponentFS.excludeDirectories) map { moduleFile =>
      val path = moduleFile.path
      val fileName = ModuleFileCommon.name(path)
      Try {
        if (HadoopConfigNames.values.map(_.toString) contains fileName) {
          logger.debug(s"Replacing file [$path] with client config from the platform")
          platformService.readClientConfig(modulePath, fileName) match {
            case Some(content) =>
              fileSystem.saveFileContent(path, content)
            case None =>
              throw new NotFoundException(s"replacement for [$path] was not found")
          }
        }

        Right("ok")

      } recover {
        case e: Exception =>
          logger.error(s"Error rendering file $path", e)
          Left(s"Error rendering file $path: ${e.getMessage}")
      } get
    }

    RenderingErrors(results.collect { case Left(message) => message })
  }

  protected def renderXmlFile(xml: String, attributes: Map[String, () => Option[String]]): RenderingResult[String] = {
    val root = XML.loadString(xml)
    val (renderedNode, missing) = renderXmlElement(root, attributes)
    val printer = new scala.xml.PrettyPrinter(100, 2)
    RenderingResult(printer.format(renderedNode), missing)
  }

  private def renderXmlElement(node: Node, attributes: Map[String, () => Option[String]]): (Node, List[String]) = {
    node match {
      case Text(value) =>
        val resut = renderText(value, attributes)
        (Text(resut.rendered), resut.errors)
      case elem: Elem =>
        val rendered = elem.child.map { e =>
          renderXmlElement(e, attributes)
        }

        val elements = rendered.map(_._1)
        val missing = rendered.flatMap(_._2)

        (elem.copy(child = elements), missing.toList)

      case other => (other, List.empty)
    }
  }
}