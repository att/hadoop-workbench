package com.directv.hw.hadoop.hdfs

trait HdfsException

case class HdfsUnknownResponseException(message: String = "", cause: Throwable = null)
  extends Exception(message, cause) with HdfsException
