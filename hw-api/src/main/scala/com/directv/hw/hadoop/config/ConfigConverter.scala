package com.directv.hw.hadoop.config

trait ConfigConverter {
  def toConfig(configXml: String): List[ConfigEntry]
  def toConfigXml(entries: Iterable[ConfigEntry]): String
}
