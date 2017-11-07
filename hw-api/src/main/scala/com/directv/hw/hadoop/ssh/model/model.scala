package com.directv.hw.hadoop.ssh.model

case class RemoteFile(name: String, isDir: Boolean, permissions: Int, size: Long)

object RemotePermissions {
  val readUser: Int = 0x4 << 6
  val writeUser: Int = 0x2 << 6
  val execUser: Int = 0x1 << 6
  val readGroup: Int = 0x4 << 3
  val writeGroup: Int = 0x2 << 3
  val execGroup: Int = 0x1 << 3
  val readOther: Int = 0x4
  val writeOther: Int = 0x2
  val execOther: Int = 0x1
}