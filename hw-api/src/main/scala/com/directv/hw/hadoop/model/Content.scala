package com.directv.hw.hadoop.model

trait ParsedContent

case object EmptyParseContent extends ParsedContent

case class FileContent(text: Option[String] = None, content: Option[ParsedContent] = None)
