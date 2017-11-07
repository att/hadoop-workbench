package com.directv.hw.hadoop.oozie.service

trait OoziePropertyRenderer {
  def renderProperty(property: String): String
  def addProperties(dir: String): OoziePropertyRenderer
}
