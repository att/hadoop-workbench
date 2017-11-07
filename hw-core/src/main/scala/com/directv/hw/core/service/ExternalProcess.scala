package com.directv.hw.core.service

import java.io.File

import com.directv.hw.core.exception.ConfigurationException
import com.directv.hw.process.InMemoryProcessLogger
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}

import scala.sys.process.Process

class ExternalProcessBuilderImpl extends ExternalProcessBuilder with LazyLogging{
  private var executor: ExternalProcessExecutor = ScalaExecutor
  private var env: Seq[(String, String)] = Seq.empty
  private var cmd: Seq[String] = Seq.empty
  private var dir: Option[File] = None

  override def executor(executor: ExternalProcessExecutor) = {
    this.executor = executor
    this
  }

  override def commandLine(cmd: Seq[String]) = {
    this.cmd = cmd
    this
  }

  override def withEnv(env: Seq[(String, String)]) = {
    this.env = env
    this
  }

  override def inDir(dir: File) = {
    this.dir = Some(dir)
    this
  }

  override def run: ProcessResult = {
    validate()
    executor match {
      case ScalaExecutor =>
        logger.debug(s"Running scala process executor: [$cmd]")
        val pLogger = new InMemoryProcessLogger
        val process = Process(cmd, dir, env: _*).run(pLogger)
        val exitValue = process.exitValue()
        val result = ProcessResult(pLogger.getOut, pLogger.getErr, exitValue)
        logger.debug(s"Execution result: $result")
        result
      case JavaExecutor =>
        logger.debug(s"Running java process executor: [$cmd]")
        val pb = new ProcessBuilder(cmd: _*)
        env.foreach { case (variable, value) =>
          pb.environment().put(variable, value)
        }
        val process = pb.start()
        process.waitFor()
        val output = scala.io.Source.fromInputStream(process.getInputStream).getLines().mkString("\n")
        val result = ProcessResult(output, "", process.exitValue())
        logger.debug(s"Execution result: $result")
        result
    }
  }

  private def validate() = {
    if (cmd.isEmpty) {
      throw new IllegalStateException("Command line not set")
    }
  }
}

class ExternalProcessFactoryImpl(implicit injector: Injector) extends ExternalProcessFactory with Injectable {
  private val appConf = inject[AppConf]

  override def newBuilder: ExternalProcessBuilder = {
    val executor = appConf.externalExecutor match {
      case "scala" => ScalaExecutor
      case "java" => JavaExecutor
      case other => throw ConfigurationException(s"Unknown external executor type: [$other]")
    }
    new ExternalProcessBuilderImpl().executor(executor)
  }
}