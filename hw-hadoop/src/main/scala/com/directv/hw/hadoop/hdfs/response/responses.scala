package com.directv.hw.hadoop.hdfs.response

import com.directv.hw.hadoop.hdfs.model.HdfsFileStatus

case class BooleanResult(boolean: Boolean)
case class FileStatusResp(FileStatus: HdfsFileStatus)
case class FileStatuses(FileStatus: List[HdfsFileStatus])
case class FileStatusesResp(FileStatuses: FileStatuses)
