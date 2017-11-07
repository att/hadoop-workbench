package com.directv.hw.core.access


case class SrvUser(id: Option[Int],
                   name: String,
                   owner: Option[String] = None,
                   keyId: Option[Int] = None,
                   homePath: Option[String] = None,
                   team: Option[String] = None,
                   platformId: Option[Int] = None,
                   clusterId: Option[String] = None)