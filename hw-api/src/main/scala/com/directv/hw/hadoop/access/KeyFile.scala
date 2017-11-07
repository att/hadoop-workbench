package com.directv.hw.hadoop.access

import com.directv.hw.hadoop.access.KeyTypes.KeyType
import com.directv.hw.util.ParameterEnumeration

object KeyTypes extends ParameterEnumeration {
  type KeyType = Value

  val pem = Value("pem")
  val keyTab = Value("keytab")
}

case class KeyFile(id: Option[Int],
                   `type`: KeyType,
                   name: String,
                   owner: Option[String] = None,
                   platformId: Option[Int] = None,
                   clusterId: Option[String] = None)

case class KeyFileInfo(id: Int, name: String)
case class KeyFileId(id: Int)
