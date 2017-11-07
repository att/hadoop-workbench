package com.directv.hw.hadoop.hdfs

import com.directv.hw.core.exception.NotSupportedException
import com.directv.hw.hadoop.hdfs.model.HdfsFileTypes.HdfsFileType
import com.directv.hw.hadoop.hdfs.model.{HdfsFileStatus, HdfsFileTypes}
import com.directv.hw.hadoop.hdfs.response.{BooleanResult, FileStatusResp, FileStatuses, FileStatusesResp}
import spray.httpx.SprayJsonSupport
import spray.httpx.marshalling.MetaMarshallers
import spray.json.{DefaultJsonProtocol, JsValue, RootJsonFormat}

trait HdfsJsonFormats extends DefaultJsonProtocol with MetaMarshallers {
  implicit val booleanResponse = jsonFormat1(BooleanResult)

  implicit object HdfsFileTypeFormat extends RootJsonFormat[HdfsFileType] {
    override def read(json: JsValue): HdfsFileType = HdfsFileTypes.fromString(json.convertTo[String])
    def write(x: HdfsFileType) = throw new NotSupportedException
  }

  implicit val filestatus = jsonFormat10(HdfsFileStatus)
  implicit val filestatusResp = jsonFormat1(FileStatusResp)
  implicit val filestatuses = jsonFormat1(FileStatuses)
  implicit val filestatusesResp = jsonFormat1(FileStatusesResp)
}
