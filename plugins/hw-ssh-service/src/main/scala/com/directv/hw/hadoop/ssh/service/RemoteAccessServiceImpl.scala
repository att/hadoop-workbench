package com.directv.hw.hadoop.ssh.service

import java.io._

import com.directv.hw.common.io.DapIoUtils._
import com.directv.hw.hadoop.ssh.exception.RemoteAccessException
import com.directv.hw.hadoop.ssh.model.RemoteFile
import com.jcraft.jsch._
import com.typesafe.scalalogging.LazyLogging
import org.apache.commons.io.IOUtils
import resource._

import scala.collection.JavaConverters._
import scala.language.{postfixOps, reflectiveCalls}
import scala.util.{Failure, Try}

class RemoteAccessServiceImpl(jsch: JSch, user: String, host: String, port: Int, openSession: Session => Session)
  extends RemoteAccessService with LazyLogging {

  private val expectedErrorPattern = "Could not chdir to home directory \\S+: No such file or directory\\s*".r

  type ReflectiveDisposable = {def disconnect()}

  implicit def reflectiveDisposableResource[A <: ReflectiveDisposable]: Resource[A] = new Resource[A] {
    override def close(r: A) = r.disconnect()
    override def closeAfterException(r: A, t: Throwable): Unit = r.disconnect()
  }

  @throws[JSchException]
  private def withSession[T](op: Session => T) = {
    val errorHandler: PartialFunction[Throwable, Try[T]] = {
      case e: JSchException =>
        val message = e.getMessage match {
          case auth if auth equalsIgnoreCase "Auth fail" =>
            "Authentication failed"
          case _ =>
            "Cannot execute remote operation"
        }
        Failure(new RemoteAccessException(message, e))
      case e: SftpException =>
        Failure(new RemoteAccessException("Cannot execute remote operation", e))
      case e: Exception =>
        Failure(e)
    }
    managed2(openSession(jsch.getSession(user, host, port)))({
      op(_)
    }, errorHandler
    )
  }

  override def listFiles(path: String): List[RemoteFile] = {
    logger.debug("Reading contents of remote directory [$path]")
    withSession { session =>
      managed2(session.openChannel("sftp").asInstanceOf[ChannelSftp]) { channel =>
        channel.connect()

        val entries = Try {
          channel.ls(path).asScala.toList
        } recover {
          // workaround for non-existing dir
          case e: SftpException if e.getMessage == "No such file" => List.empty
        } get

        entries map { o =>
          val f = o.asInstanceOf[ChannelSftp#LsEntry]
          val attrs = f.getAttrs
          RemoteFile(f.getFilename, attrs.isDir, attrs.getPermissions, attrs.getSize)
        } filterNot (f => f.name == "." || f.name == "..")
      }
    }
  }

  override def retrieveFile(path: String)(read: InputStream => Unit) = {
    logger.debug("Reading remote file [$path]")
    withSession { session =>
      val channel = session.openChannel("sftp").asInstanceOf[ChannelSftp]
      channel.connect()
      managed2(channel.get(path))(read)
    }
  }

  @throws[RemoteAccessException]
  override def transferFile(source: File, dest: String): Unit = {
    logger.debug( s"""scp source - \"${source.getName}\", destination - \"$dest\"""")

    withSession { session =>
      val channel = session.openChannel("exec")
      channel.asInstanceOf[ChannelExec].setCommand( s"""scp -t \"$dest\"""")
      val out = channel.getOutputStream
      val in = channel.getInputStream
      channel.connect()
      checkAck(in)

      val fileCommand = s"C0644 ${source.length} ${source.getName}\n"

      out.write(fileCommand.getBytes)
      out.flush()

      checkAck(in)

      managed2(new FileInputStream(source)) { input =>
        copy(input, out)
        out.write(Array[Byte](0), 0, 1)
        out.flush()
      }

      checkAck(in)
    }
  }


  def copy(in: InputStream, out: OutputStream): Unit = {
    val buf = new Array[Byte](1 << 20) // 1 MB
    while (true) {
      val read = in.read(buf)
      if (read == -1) {
        out.flush()
        return
      }

      out.write(buf, 0, read)
    }
  }

  def checkAck(in: InputStream): Int = {
    val b = in.read()

    // 0 for success,
    // 1 for error,
    // 2 for fatal error,
    // -1

    if (b == 1 || b == 2) {
      throw new RemoteAccessException(Iterator.continually(in.read.asInstanceOf[Char]).takeWhile(_ != '\n').mkString)
    }

    b
  }


  override def close(): Unit = {
    /*close resources*/
  }

  @throws[RemoteAccessException]
  override def dirAvailable(path: String): Boolean = {
    logger.debug(s"checkDir path=[$path]")
    var res: Either[Throwable, Boolean] = Right(false)
    withSession { session =>
      val channel = session.openChannel("sftp")
      val stat = Try(channel.asInstanceOf[ChannelSftp].stat(path))
      if (stat != null && stat.isSuccess && stat.get.isDir) res = Right(true)
      else if (stat.isFailure) res = Left(stat.failed.get)
      else res = Right(false)
    }

    // TODO: vvozdroganov - is it possible without var ?
    if (res.isLeft) throw new RemoteAccessException(s"Unable to check dir [$path]", res.left.get)
    else res.right.get
  }

  override def mkDir(path: String) = {
    logger.debug(s"mkDir path=[$path]")
    withSession { session ⇒
      val channel = session.openChannel("sftp")
      channel.asInstanceOf[ChannelSftp].mkdir(path)
    }
  }

  override def rm(path: String) = {
    logger.debug(s"rm path=[$path]")
    executeCommand( s"""rm '$path' """)
  }

  override def rmDir(path: String) = {
    logger.debug(s"rmDir path=[$path]")

    val pathTowipe = if (path.last == '/') path.take(path.length - 1)
    executeCommandStrict( s"""rm -rf '$pathTowipe'/*""", s"remove dir $pathTowipe")
  }

  override def wipeDir(path: String) = {
    val dir = if (path.last == '/') path.take(path.length - 1) else path

    logger.debug(s"wipeDir path=[$dir]")
    executeCommandStrict( s"""rm -rf '$dir'/*""", s"clean dir $dir")
  }

  override def move(path: String, to: String) = {
    logger.debug(s"renaming path=[$path] to [$to]")
    executeCommand( s"""mv '$path' '$to' """)
  }

  override def mkDirs(path: String) = {
    logger.debug(s"mkDirs path[s]=[$path]")
    executeCommandStrict( s"""mkdir -p '$path' """, s"create dir $path")
  }

  override def chown(path: String, user: String) = {
    logger.debug(s"chown path[s]=[$path] to [$user]")
    executeCommand( s"""chown -R $user '$path' """)
  }

  override def chmod(path: String, permissions: String) = {
    logger.debug(s"chmod path[s]=[$path] to [$permissions]")
    executeCommand( s"""chmod -R $permissions '$path' """)
  }

  private def executeCommand(command: String): (String, String) = {
    logger.debug(s"executing command [$command]")
    withSession { session ⇒
      managed2(session.openChannel("exec")) { case exec: ChannelExec =>
        exec.setCommand(command)
        val eis = exec.getErrStream
        val is = exec.getInputStream
        exec.connect()
        readStream(is) -> readStream(eis)
      }
    }
  }

  private def readStream(is: InputStream) = IOUtils.readLines(is).asScala mkString "\n"

  private def executeCommandStrict(command: String, desc: String = "") = {
    val (out, err) = executeCommand(command)
    // TODO (vkolischuk) nasty hack. Investigate later
    val actualErr = expectedErrorPattern.replaceAllIn(err, "")
    if (actualErr.nonEmpty) {
      logger.error(s"Could not execute command [$command]. Error: [$err]")
      throw new RemoteAccessException(s"Could not $desc")
    }
    out
  }
  
}