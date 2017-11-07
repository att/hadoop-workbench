package com.directv.hw.web.hdfs.model


case class HdfsFileContent(content: String)

case class PartialHdfsFileMeta(owner: Option[String], group: Option[String], permissions: Option[String],
                        accessTime: Option[Long], modificationTime: Option[Long])

case class WebHdfsUser(id: Option[Int], name: String, homePath: Option[String] = None, team: Option[String] = None)

case class WebHdfsUsers(users: List[WebHdfsUser])

case class HdfsBatchRequest(files: List[String],
                            owner: Option[String],
                            group: Option[String],
                            permissions: Option[String],
                            accessTime: Option[Long],
                            modificationTime: Option[Long])

case class HdfsBatchResponse(filesSuccess: List[String], errors: List[String])