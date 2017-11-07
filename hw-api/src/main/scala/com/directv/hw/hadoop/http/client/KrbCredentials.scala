package com.directv.hw.hadoop.http.client

import java.nio.file.Path

sealed trait ServiceCredentials
case class KrbCredentials(principal: String, key: Path) extends ServiceCredentials
case class SimpleCredentials(user: String) extends ServiceCredentials
