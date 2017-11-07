package com.directv.hw.hadoop.config

import com.samskivert.mustache.Mustache.VariableFetcher
import com.samskivert.mustache.{DefaultCollector, Mustache, MustacheException}

import scala.collection.mutable.ArrayBuffer

class PropertiesCollector extends DefaultCollector {

  private val _missed = ArrayBuffer.empty[String]

  def missed: List[String] = _missed.toList

  override def createFetcher(ctx: AnyRef, name: String): VariableFetcher = {
    ctx match {
      case _: Map[_, _] => mapFetcher
      case _ => throw new MustacheException(s"mustache context is not supported - " + ctx.getClass.getName)
    }
  }

  protected val mapFetcher: Mustache.VariableFetcher = new Mustache.VariableFetcher() {
    @throws(classOf[Exception])
    def get(ctx: AnyRef, name: String): AnyRef = {
      val map = ctx.asInstanceOf[Map[String, () => Option[String]]]
      map.get(name).flatMap(_.apply()).getOrElse(notFound(name))
    }
  }

  def notFound(name: String): AnyRef = {
    if (!_missed.exists(_.startsWith(name))) {
      _missed += name
    }

    // leave empty
    ""
  }
}
