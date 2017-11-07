package com.directv.hw.hadoop.ssh.service

import java.io.{File, InputStream}

import com.directv.hw.hadoop.ssh.exception.RemoteAccessException
import com.directv.hw.hadoop.ssh.model.RemoteFile

trait RemoteAccessService extends java.io.Closeable {

  def listFiles(path: String): List[RemoteFile]

  @throws[RemoteAccessException]
  def transferFile(source: File, dest:String)

  def retrieveFile(path: String)(read: InputStream => Unit)

  def close()

  def dirAvailable(path: String): Boolean

  def mkDirs(path: String)

  def mkDir(path: String)

  def move(path: String, to: String)

  def rm(path: String)

  /**
   * Delete children but keep the directory itself
   */
  def wipeDir(path: String)

  def rmDir(path: String): Unit

  def chown(path: String, user: String)

  def chmod(path: String, permissions: String)

}
