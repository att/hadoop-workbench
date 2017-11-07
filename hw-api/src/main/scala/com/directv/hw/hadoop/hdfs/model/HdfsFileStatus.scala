package com.directv.hw.hadoop.hdfs.model

import com.directv.hw.hadoop.hdfs.model.HdfsFileTypes.HdfsFileType
import com.directv.hw.util.ParameterEnumeration

case class HdfsFileStatus(accessTime: Long,
                      blockSize: Long,
                      group: String,
                      length: Long,
                      modificationTime: Long,
                      owner: String,
                      pathSuffix: String,
                      permission: String,
                      replication: Short,
                      `type`: HdfsFileType)

object HdfsFileTypes extends ParameterEnumeration {
  type HdfsFileType = HdfsFileTypes.Value

  val directory = Value("DIRECTORY")
  val file = Value("FILE")
}
