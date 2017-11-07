package com.directv.hw.common.io

import java.io._
import java.nio.file.{Files, Path}

import com.directv.hw.common.io.DapIoUtils._
import com.directv.hw.hadoop.model.{ModuleFile, ModuleFileCommon}
import org.apache.commons.compress.archivers.tar.{TarArchiveEntry, TarArchiveInputStream, TarArchiveOutputStream}
import org.apache.commons.compress.archivers.zip.ZipArchiveInputStream
import org.apache.commons.compress.compressors.bzip2.{BZip2CompressorInputStream, BZip2CompressorOutputStream}
import org.apache.commons.compress.compressors.gzip.GzipCompressorInputStream
import org.apache.commons.io.{FileUtils, IOUtils}

import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global

object PackUtils {

  def unpackTarBzip2(is: InputStream, toDir: Path) = {
    val tarFile: Path = Files.createTempFile("unpack", ".tar")
    try {
      unpackBzip2(is, tarFile)
      unpackTar(tarFile, toDir)
    } finally {
      FileUtils.forceDelete(tarFile.toFile)
    }
  }

  def unpackBzip2(is: InputStream, file: Path) = {
    managed2(new BZip2CompressorInputStream(new BufferedInputStream(is))) { is =>
      managed2(new BufferedOutputStream(Files.newOutputStream(file))) { os =>
        IOUtils.copy(is, os)
      }
    }
  }

  def unpackTar(source: Path, toDir: Path) = {
    managed2(new TarArchiveInputStream(new BufferedInputStream(Files.newInputStream(source)))) { tarStream =>
      Iterator
      .continually(tarStream.getNextTarEntry)
      .takeWhile(_ != null)
      .foreach { entry =>
        val file = toDir.resolve(entry.getName)
        if (entry.isDirectory) {
          Files.createDirectories(file)
        } else {
          Files.createDirectories(file.getParent)
          managed2(Files.newOutputStream(file))(IOUtils.copy(tarStream, _))
        }
      }
    }
  }

  def packTarBz2Async(os: OutputStream, list: List[ModuleFile], read: String => InputStream, root: Option[String] = None) = {
    Future(packTarBz2(os, list, read, root))
  }


  def packTarBz2(os: OutputStream, list: List[ModuleFile], read: String => InputStream, root: Option[String] = None): Unit = {
    managed2(new BZip2CompressorOutputStream(os)) { os =>
      packTar(os, list, read, root)
    }
  }

  def packTar(os: OutputStream, list: List[ModuleFile], read: String => InputStream, root: Option[String] = None): Unit = {
    managed2(new TarArchiveOutputStream(os)) { tarStream =>
      val (files, _) = list partition (_.`type` == ModuleFileCommon.file)
      files foreach { file =>
        val path = root map (r => s"$r/${file.path}") getOrElse file.path
        val entry = new TarArchiveEntry(path)
        managed2(read(file.path)) { is =>
          if (file.size >= 0) {
            entry.setSize(file.size)
            tarStream.putArchiveEntry(entry)
            IOUtils.copy(is, tarStream)
          } else {
            val baos = new ByteArrayOutputStream()
            IOUtils.copy(is, baos)
            entry.setSize(baos.size())
            tarStream.putArchiveEntry(entry)
            baos.writeTo(tarStream)
          }
        }

        tarStream.closeArchiveEntry()
      }
    }
  }

  def unpackZip(zipContent: Array[Byte]): Map[String, Array[Byte]] = {
    managed2(new ZipArchiveInputStream(new ByteArrayInputStream(zipContent))) { zis =>
      Iterator
        .continually(zis.getNextZipEntry)
        .takeWhile(_ != null)
        .map { entry =>
          val name = entry.getName
          val rawSize = entry.getSize.toInt
          val content = if(rawSize >= 0) {
            IOUtils.toByteArray(zis, rawSize)
          } else {
            IOUtils.toByteArray(zis)
          }
          name -> content
        }
        .toMap
    }
  }

  def unpackTarGZip(tarContent: Array[Byte]): Map[String, Array[Byte]] = {
    managed2(new TarArchiveInputStream(new GzipCompressorInputStream(new ByteArrayInputStream(tarContent)))) { tar =>
      Iterator
        .continually(tar.getNextTarEntry)
        .takeWhile(_ != null)
        .map { entry =>
          val name = entry.getName
          val rawSize = entry.getSize.toInt
          val content = if (rawSize >= 0) {
            IOUtils.toByteArray(tar, rawSize)
          } else {
            IOUtils.toByteArray(tar)
          }
          name -> content
        }
        .toMap
    }
  }
}
