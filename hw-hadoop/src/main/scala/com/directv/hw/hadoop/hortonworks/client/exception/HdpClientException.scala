package com.directv.hw.hadoop.hortonworks.client.exception

case class HdpClientException(message: String = "", cause: Throwable = null) extends Exception(message, cause)
case class ComponentAlreadyExists(name: String) extends Exception

