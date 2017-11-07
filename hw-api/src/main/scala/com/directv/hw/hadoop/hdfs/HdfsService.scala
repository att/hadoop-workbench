package com.directv.hw.hadoop.hdfs

import akka.stream.scaladsl.Source
import akka.util.ByteString
import com.directv.hw.hadoop.hdfs.model.HdfsFileStatus

trait HdfsService {

  def getTextFile(path: String,
                  offset: Option[Long] = None,
                  length: Option[Long] = None): String

  def tryTextFile(path: String,
                  offset: Option[Long] = None,
                  length: Option[Long] = None): Option[String]

  def getBinaryFile(path: String,
                    offset: Option[Long] = None,
                    length: Option[Long] = None): Array[Byte]

  def downloadFile(path: String,
                   offset: Option[Long] = None,
                   length: Option[Long] = None): Source[ByteString, _]

  def createFile(path: String,
                 content: Array[Byte],
                 overwrite: Option[Boolean] = Some(true),
                 permission: Option[Int] = None,
                 blocksize: Option[Long] = None,
                 replication: Option[Short] = None): Unit

  def uploadFile(path: String,
                 content: Source[ByteString, _],
                 overwrite: Option[Boolean] = Some(true),
                 permission: Option[Int] = None,
                 blocksize: Option[Long] = None,
                 replication: Option[Short] = None): Unit

  def makeDirs(path: String, permission: Option[Int] = None): Boolean
  def rename(path: String, destination: String): Boolean
  def delete(path: String, recursive: Option[Boolean] = Some(true)): Boolean
  def appendToFile(path: String, content: Array[Byte]): Unit
  def setPermission(path: String, permission: Option[Int]): Unit
  def setOwner(path: String,
               owner: Option[String] = None,
               group: Option[String] = None): Unit

  def setFileTimes(path: String,
                   access: Option[Long] = None,
                   modification: Option[Long] = None): Unit

  def listFiles(path: String): List[HdfsFileStatus]
  def fileStatus(path: String): HdfsFileStatus
}