package com.directv.hw.hadoop.ssh.service

import java.io.File

import com.directv.hw.hadoop.ssh.plugin.RemoteAccessServiceFactoryImpl
import com.typesafe.scalalogging.LazyLogging
import org.scalatest.{FlatSpec, Matchers}

class RemoteAccessServiceSpec extends FlatSpec with Matchers with LazyLogging {

  ignore should "should connect using password" in {
    val factory = new RemoteAccessServiceFactoryImpl
    val service = factory.getPassBasedService("10.26.75.77", 22, "d511982", "")
    val dir = "/tmp/vvozdroganov"
    service.mkDirs(dir)
    val fileName = getClass.getClassLoader.getResource("vd-auditlog-1.0.6.jar").getFile
    service.transferFile(new File(fileName), dir)
  }
}
