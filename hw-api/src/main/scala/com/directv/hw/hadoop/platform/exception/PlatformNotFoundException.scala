package com.directv.hw.hadoop.platform.exception

case class PlatformNotFoundException(message: String = "") extends Exception(message)
