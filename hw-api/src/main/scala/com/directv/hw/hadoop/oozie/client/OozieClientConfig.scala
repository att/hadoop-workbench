package com.directv.hw.hadoop.oozie.client

sealed class OozieClientConfig

case class OozieKrbClientConfig(url: String, principal: String, keytabPath: String) extends OozieClientConfig
case class OozieSimpleClientConfig(url: String, user: String) extends OozieClientConfig
