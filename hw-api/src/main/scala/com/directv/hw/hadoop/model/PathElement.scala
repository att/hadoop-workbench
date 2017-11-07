package com.directv.hw.hadoop.model

object PathCommon {
  val fileType = "FILE"
  val dirType = "DIR"

  val separator = "/"
  val root = separator

  // TODO (vkolischuk) move to common
  def normalizePath(path: String) = {
    val absPath = if(path startsWith separator) path else separator + path
    absPath match {
      case p if p.endsWith(separator) && p != root => p.substring(0, p.length - 1)
      case _ => absPath
    }
  }

  def concat(path: String, child: String) = (if (path endsWith separator) path else path + separator) + child

  def extractName(path: String) = {
    path match {
      case `root` => root
      case _ => path substring (path.lastIndexOf(separator) + 1)
    }
  }
}

case class PathElement(name: String, path: String, `type`: String,
                       size: Option[Long] = None,
                       accessTime: Option[Long] = None,
                       modificationTime: Option[Long] = None,
                       owner: Option[String] = None,
                       group: Option[String] = None,
                       permissions: Option[String] = None,
                       children: Option[List[PathElement]] = None) {

  def flatChildren = children getOrElse List.empty
}
