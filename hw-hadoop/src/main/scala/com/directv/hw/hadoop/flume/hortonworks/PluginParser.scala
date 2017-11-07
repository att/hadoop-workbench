package com.directv.hw.hadoop.flume.hortonworks

class PluginParserException(message: String = "") extends Exception(message)

class PluginParser {
  val PluginLineP = """(export\s*PLUGIN_DIR\s*=\s*)(.*)""".r
  val ClasspathLineP = """(export\s+FLUME_CLASSPATH\s*=\s*[$]FLUME_CLASSPATH:[$]PLUGIN_DIR)""".r

  def readPluginValue(evnConfig: String): String = {
    val pluginDir = parse(evnConfig).collectFirst { case PluginLineP(_, dir) => dir }
    pluginDir.getOrElse("")
  }

  def injectPluginDir(evnConfig: String, pluginDir: String): String = {

    // remove plugin dir declaration
    val cleanConfig = parse(evnConfig).map {
      case PluginLineP(_, _) => ""
      case ClasspathLineP(_) => ""
      case rest => rest
    }.mkString("\n")

    //add new value
    cleanConfig +
    "export PLUGIN_DIR=" + pluginDir + "\n" +
    "export FLUME_CLASSPATH=$FLUME_CLASSPATH:$PLUGIN_DIR"
  }

  private def parse(envConfig: String) = {
    scala.io.Source.fromString(envConfig).getLines()
  }
}
