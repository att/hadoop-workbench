package com.diretv.dap.common.io

import java.nio.file.Files

import com.directv.hw.common.io.PackUtils
import org.apache.commons.io.FileUtils
import org.scalatest.{Matchers, FlatSpec}
import com.directv.hw.common.io.DapIoUtils._
import collection.JavaConversions._

class PackUtilsSpec extends FlatSpec with Matchers  {

  "it" should "unpack" in {
    val is = getClass.getClassLoader.getResourceAsStream("test.tar.bz2")
    val tempDir = Files.createTempDirectory("test_unpack")
    try {
      PackUtils.unpackTarBzip2(is, tempDir)
      managed2(Files.newDirectoryStream(tempDir)) { dirStream =>
        dirStream.toList.size > 0 shouldBe true
      }

    } finally {
      FileUtils.deleteDirectory(tempDir.toFile)
    }
  }
}
