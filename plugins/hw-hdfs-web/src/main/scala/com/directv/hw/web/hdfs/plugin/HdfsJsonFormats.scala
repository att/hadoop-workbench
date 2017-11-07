package com.directv.hw.web.hdfs.plugin

import com.directv.hw.common.web.CommonJsonFormats
import com.directv.hw.hadoop.model.PathElement
import com.directv.hw.web.hdfs.model._
import spray.json._

trait HdfsJsonFormats extends CommonJsonFormats {

  implicit val hdfsFileContentFormat = jsonFormat1(HdfsFileContent)
  implicit val partialHdfsFileMetaFormat = jsonFormat5(PartialHdfsFileMeta)
  implicit val webHdfsUserFormat = jsonFormat4(WebHdfsUser)
  implicit val webHdfsUsersFormat = jsonFormat1(WebHdfsUsers)
  implicit val hdfsBatchRequestFormat = jsonFormat6(HdfsBatchRequest)
  implicit val hdfsBatchResponseFormat = jsonFormat2(HdfsBatchResponse)
}
