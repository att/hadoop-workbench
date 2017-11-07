package com.directv.hw.hadoop.http.client

import java.security.{Principal, PrivilegedAction}
import java.util
import java.util.Base64
import javax.security.auth.Subject
import javax.security.auth.kerberos.KerberosPrincipal
import javax.security.auth.login.LoginContext

import com.typesafe.scalalogging.LazyLogging
import org.ietf.jgss.{GSSContext, GSSManager, GSSName, Oid}

import scala.util.{Failure, Success, Try}

trait SpNegoTokenGenerator {
  def generate(principal: String, keyPath: String, host: String): Try[String]
}

class SpNegoTokenGeneratorImpl extends SpNegoTokenGenerator with LazyLogging {

  override def generate(principal: String, keyPath: String, host: String): Try[String] = {
    try {
      val loginConfig = new LoginConfig(principal, keyPath)
      val princ = new util.HashSet[Principal](1)
      princ.add(new KerberosPrincipal(principal))
      val sub = new Subject(false, princ, new util.HashSet[AnyRef], new util.HashSet[AnyRef])
      val lc = new LoginContext("", sub, null, loginConfig)
      lc.login()

      val serviceSubject = lc.getSubject
      val token = Subject.doAs(serviceSubject, new PrivilegedAction[String]() {
        override def run: String = {
          val token = new Array[Byte](0)
          val manager = GSSManager.getInstance
          val oid = new Oid("1.3.6.1.5.5.2")
          val serverName = manager.createName(s"HTTP@$host", GSSName.NT_HOSTBASED_SERVICE)
          val gssContext = manager.createContext(serverName.canonicalize(oid), oid, null, GSSContext.DEFAULT_LIFETIME)
          gssContext.requestMutualAuth(true)
          gssContext.requestCredDeleg(true)

          val result = gssContext.initSecContext(token, 0, token.length)
          val base64 = Base64.getEncoder
          new String(base64.encode(result))
        }
      })

      Success(token)
    } catch {
      case e: Throwable => Failure(e)
    }
  }
}
