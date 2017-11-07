package com.directv.hw.core.service

import java.io.File

case class ProcessResult(out: String, err: String, exitCode: Int)

trait ExternalProcessFactory {
  def newBuilder: ExternalProcessBuilder
}

sealed trait ExternalProcessExecutor
case object JavaExecutor extends ExternalProcessExecutor
case object ScalaExecutor extends ExternalProcessExecutor

trait ExternalProcessBuilder {
  def executor(executor: ExternalProcessExecutor): ExternalProcessBuilder
  def commandLine(cmd: Seq[String]): ExternalProcessBuilder
  def withEnv(env: Seq[(String, String)]): ExternalProcessBuilder
  def inDir(dir: File): ExternalProcessBuilder
  def run: ProcessResult
}
