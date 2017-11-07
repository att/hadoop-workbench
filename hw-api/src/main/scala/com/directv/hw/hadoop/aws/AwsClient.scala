package com.directv.hw.hadoop.aws

import java.io.InputStream
import java.nio.file.Path

trait AwsClient {
  def getObjectAsStream(bucket: String, key: String): InputStream
  def uploadObject(bucket: String, key: String, path: Path): Unit
  def uploadObject(bucket: String, key: String, input: InputStream): Unit
  def getObjects(bucket: String): List[String]
}
