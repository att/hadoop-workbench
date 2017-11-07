package com.directv.hw.hadoop.host.model

case class PlatformHost(id: String, ip: String, hostname: Option[String] = None)

case class PlatformHostAccess(id: Option[Int],
                              port: Int,
                              userName: Option[String],
                              password: Option[String],
                              keyFileId: Option[Int],
                              pluginDirs: List[String])

case class HostAccess(`type`: String, userName: Option[String], password: Option[String], keyFile: Option[String])

case class FullHostAccess(id: Option[Int], host: String, port: Int, access: HostAccess)
