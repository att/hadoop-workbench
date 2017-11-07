package com.directv.hw.hadoop.flume.hortonworks

import org.scalatest.{Matchers, FlatSpec}

class PluginParserSpec extends FlatSpec with Matchers {
  val parser = new PluginParser

  "parser" should "read plugin dir" in {

    val config =
      """|export HIVE_HOME={{flume_hive_home}}
         |export HCAT_HOME={{flume_hcat_home}}
         |export PLUGIN_DIR = /usr/lib/flume/lib
         |export FLUME_CLASSPATH=$FLUME_CLASSPATH:$PLUGIN_DIR
         |""".stripMargin

    val dir = parser.readPluginValue(config)
    dir shouldBe "/usr/lib/flume/lib"
  }

  "parser" should "read plugin dir2" in {

    val config =
      """|export HIVE_HOME={{flume_hive_home}}
         |export HCAT_HOME={{flume_hcat_home}}
         |export   PLUGIN_DIR=   /usr/lib/flume/lib
         |export FLUME_CLASSPATH=$FLUME_CLASSPATH:$PLUGIN_DIR
         |""".stripMargin

    val dir = parser.readPluginValue(config)
    dir shouldBe "/usr/lib/flume/lib"
  }

  "parser" should "inject plugin dir" in {

    val config =
      """|export HIVE_HOME={{flume_hive_home}}
        |export HCAT_HOME={{flume_hcat_home}}
        |export PLUGIN_DIR=/usr/lib/flume/lib
        |export FLUME_CLASSPATH=$FLUME_CLASSPATH:$PLUGIN_DIR
        |""".stripMargin

    val newConfig = parser.injectPluginDir(config, "test")
    val dir = parser.readPluginValue(newConfig)
    dir shouldBe "test"
    newConfig.split("\n") should contain ("export FLUME_CLASSPATH=$FLUME_CLASSPATH:$PLUGIN_DIR")
  }
}
