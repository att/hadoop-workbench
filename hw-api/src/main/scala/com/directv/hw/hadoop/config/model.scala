package com.directv.hw.hadoop.config

case class ConfigEntry(key: String, value: String, description: Option[String] = None, business: Option[Boolean] = None)
case class RenderingResult[T](rendered: T, errors: List[String] = List.empty)
case class RenderingErrors(messages: List[String])
case class MustacheProperty(key: String, description: Option[String] = None)
