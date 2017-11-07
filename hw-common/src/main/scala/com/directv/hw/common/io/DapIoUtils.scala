package com.directv.hw.common.io

import java.io.{File, InputStream}
import java.nio.file.Files
import java.nio.file.attribute.BasicFileAttributes

import com.directv.hw.core.exception.DapException
import com.directv.hw.hadoop.files.ComponentFS
import com.directv.hw.hadoop.model.{ModuleFile, ModuleFileCommon}
import com.typesafe.scalalogging.LazyLogging
import org.apache.commons.io.FilenameUtils
import resource._

import scala.concurrent.{ExecutionContext, Future}
import scala.io.Source
import scala.language.{implicitConversions, postfixOps}
import scala.util.control.NonFatal
import scala.util.{Failure, Success, Try}

object DapIoUtils extends LazyLogging {
  val separator = File.separator

  def safeList[V](description: String)(operation: => List[V]): List[V] = {
    Try(operation) match {
      case Success(list) =>
        list
      case Failure(e) =>
        logger.error(s"Error resolving $description", e)
        List.empty
    }
  }

  def mergeFutures[V](futures: List[Future[V]])(implicit executionContext: ExecutionContext): Future[List[V]] = {
    Future.fold(futures)(List.empty[V]) { (list, v) =>
      list :+ v
    }
  }

  def tail(file: String, n: Int): List[String] = {
    val lines = Source.fromFile(file).getLines().toList
    lines.takeRight(n)
  }

  case class Result[T](values: List[T] = List.empty,
                       errors: List[Throwable] = List.empty) {
    def +(r: Result[T]) = Result(values ++ r.values, errors ++ r.errors)
  }

  def safeMap[T, V](result: Result[T])(operation: T => V): Result[V] = {
    val nextResult = Result[V](errors = result.errors)
    result.values.foldLeft(nextResult) { (collected, t) =>
      Try {
        operation(t)
      } match {
        case Success(v) => collected.copy(values = collected.values :+ v)
        case Failure(e) => collected.copy(errors = collected.errors :+ e)
      }
    }
  }

  // TODO (vkolischuk) implement partial results collection (before every call was completed)
  def parallelize[T, V](future: Future[Result[T]])
                       (operation: T => List[V])
                       (implicit executionContext: ExecutionContext): Future[Result[V]] = {
    future flatMap { result =>
      val futures: List[Future[Result[V]]] = result.values map { t =>
        toFutureResult(operation(t))
      }
      merge(futures)
    }
  }

  def toFutureResult[T](values: => List[T])(implicit executionContext: ExecutionContext): Future[Result[T]] = {
    Future {
      Result(values = values)
    } recover {
      case e: Exception =>
        Result[T](errors = List(e))
    }
  }

  def merge[T](futures: List[Future[Result[T]]])(implicit executionContext: ExecutionContext): Future[Result[T]] = {
    Future.fold(futures)(Result[T]()) { (result, r) =>
      result + r
    }
  }

  def safeFlatten[T, V](results: Result[T])(operation: T => List[V]): Result[V] = {
    val raw: List[Result[V]] = results.values map { t =>
      Try {
        Result(values = operation(t))
      } recover {
        case e: Exception =>
          Result[V](errors = List(e))
      } get
    }
    raw.foldLeft(Result[V]())((result: Result[V], r: Result[V]) =>
      result + r
    )
  }

  @Deprecated
  def tryWithLog[T](call: => T, message: String = ""): Option[T] = {
    try {
      Some(call)
    } catch {
      case e: Throwable =>
        val actualMessage = Option(message).filter(_.nonEmpty).getOrElse("Error")
        logger.error(actualMessage, e)
        None
    }
  }

  def mkDir(dir: File): File = {
    if (!dir.mkdirs()) {
      throw new DapException(s"Cannot create dir [$dir]")
    }
    dir
  }

  def ensureDirExists(dir: File): File = {
    if (!dir.isDirectory && !dir.mkdirs()) {
      throw new DapException(s"Cannot create dir [$dir]")
    }
    dir
  }

  def collectModuleFiles(from: File, prefix: String, depth: Int, includeDirectories: Boolean): List[ModuleFile] = {
    if (from.isFile) {
      val attributes = Files.readAttributes(from.toPath, classOf[BasicFileAttributes])
      val modificationTime = attributes.lastModifiedTime().toMillis
      List(ModuleFile(prefix, ModuleFileCommon.file, from.length(), Some(modificationTime)))
    } else if (from.isDirectory) {
      val list = if (includeDirectories && prefix.nonEmpty) List(ModuleFile(prefix, ModuleFileCommon.dir, 0)) else List.empty
      if (depth != 0) {
        from.listFiles().foldLeft(list) { (list, file) =>
          list ++ collectModuleFiles(file, concat(prefix, file.getName), if (depth > 0) depth - 1 else depth, includeDirectories)
        }
      } else list
    } else {
      List.empty
    }
  }

  def concat(prefix: String, name: String): String = {
    if (prefix.isEmpty) {
      name
    } else {
      val normalizedPrefix = if (prefix.endsWith(ModuleFileCommon.separator)) prefix else prefix + ModuleFileCommon.separator
      normalizedPrefix + name
    }
  }

  def copyAll(source: ComponentFS, target: ComponentFS) = {
    source.listFiles(includeDirectories = ComponentFS.includeDirectories) foreach {
      case dir if dir.`type` == ModuleFileCommon.dir =>
        target.createDir(dir.path)
      case file if file.`type` == ModuleFileCommon.file =>
        managed2(source.readFile(file.path)) {
          target.writeFile(file.path, _)
        }
    }
  }

  def normalize(file: File): String = {
    val normalized = FilenameUtils.normalize(file.getAbsolutePath, true)
    if (file.isDirectory && !normalized.endsWith(separator)) {
      normalized + separator
    } else {
      normalized
    }
  }

  def resolveTargetPath(source: String, target: String): String = {
    target match {
      case t if t.endsWith(separator) =>
        target + (source.lastIndexOf(separator) match {
          case index if index == source.length - 1 =>
            ""
          case index if index >= 0 =>
            source.substring(index + separator.length)
          case _ =>
            source
        })
      case _ =>
        target
    }
  }

  def loadResourceAsString(clazz: Class[_], path: String): String = {
    managed2(clazz.getClassLoader.getResourceAsStream(path))({ is: InputStream =>
      scala.io.Source.fromInputStream(is).getLines().mkString("\n")
    }, {
      case e: Exception =>
        logger.error(s"Could not read resource [$path]", e)
        Failure(new DapException(s"Could not load resource [$path]"))
    })
  }

  def managed2[T, V: Resource : Manifest](v: => V)
      (operation: V => T, errorHandler: PartialFunction[Throwable, Try[T]] = PartialFunction.empty): T = {

    managed(v).map(operation).valueWithErrorHandler(errorHandler)
  }

  def managedOpt[T, V: Resource : Manifest](v: => V, errorMessage: String = "Could not execute operation")(operation: V => T): Option[T] = {
    managed2(v)( {
      v => Some(operation(v))
    }, {
      case NonFatal(e) =>
        logger.error(errorMessage, e)
        Success(None)
    })
  }

  implicit def toSimplifiedExtractableManagedResource[T](resource: ExtractableManagedResource[T]): SimplifiedExtractableManagedResource[T] = {
    new SimplifiedExtractableManagedResource(resource)
  }

  class SimplifiedExtractableManagedResource[T](resource: => ExtractableManagedResource[T]) {
    def value: T = valueWithErrorHandler(PartialFunction.empty[Throwable, Try[T]])

    def valueWithErrorHandler(errorHandler: PartialFunction[Throwable, Try[T]]): T = {
      val either: Either[Seq[Throwable], T] = Try {
        resource.either
      } recover {
        case e: Exception =>
          Left(Seq(e))
      } get

      either.fold(
      {
        _ map { e =>
          if (errorHandler.isDefinedAt(e)) errorHandler(e).get else throw e
        } head
      }, { t: T => t }
      )
    }
  }

  trait BinaryData {
    def chunks(): Iterator[Array[Byte]]
  }

  class BinaryDataFromArray(array: Array[Byte]) extends BinaryData {
    override val chunks = Stream(array).iterator
  }

  class BinaryDataFromStream(inputStream: => InputStream) extends BinaryData {
    override def chunks() = {
      DapIoUtils.managed2(inputStream) { is =>
        var buffer: Array[Byte] = new Array(10 * 1024 * 1024)
        Iterator.continually {
          buffer = is.read(buffer) match {
            case eof if eof < 0 =>
              Array.empty[Byte]
            case bytesRead if bytesRead < buffer.length =>
              buffer.slice(0, bytesRead)
            case _ =>
              buffer
          }
          buffer
        } takeWhile {
          _.nonEmpty
        }
      }
    }
  }

  def toJavaLong(o: Option[Long]): java.lang.Long = o map (new java.lang.Long(_)) orNull

  def toJavaInteger(o: Option[Int]): java.lang.Integer = o map (new java.lang.Integer(_)) orNull

  def actorHandler(handler: PartialFunction[Any, Unit], prefixMessage: String = ""): PartialFunction[Any, Unit] = {
    handler orElse {
      case unknown =>
        logger.warn(s"$prefixMessage unknown message ${unknown.getClass.getName}")
    }
  }
}
