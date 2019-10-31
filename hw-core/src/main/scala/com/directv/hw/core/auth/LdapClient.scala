package com.directv.hw.core.auth

import com.directv.hw.common.io.DapIoUtils
import com.directv.hw.common.io.DapIoUtils._
import com.directv.hw.core.exception.CalleeException
import com.directv.hw.core.service.AppConf
import com.typesafe.scalalogging.LazyLogging
import com.unboundid.ldap.sdk._
import com.unboundid.util.ssl.{SSLUtil, TrustAllTrustManager}

import scala.collection.JavaConverters._
import scala.util.{Success, Try}

trait LdapClient {
  def verifyCredentials(user: String, password: String): Boolean
  def getUser(userId: String): Option[LdapUser]
}

class LdapClientImpl(appConfig: AppConf) extends LdapClient with LazyLogging {

  override def verifyCredentials(user: String, password: String): Boolean = {
      val errorHandler: PartialFunction[Throwable, Try[Boolean]] = {
        case e: LDAPException if e.getResultCode == ResultCode.INVALID_CREDENTIALS =>
          logger.debug(s"Auth: Incorrect password for user [$user]")
          Success(false)
      }

      logger.debug(s"Auth: trying to log in user [$user]")
      DapIoUtils.managed2(createLdapConnection)({ connection: LDAPConnection =>
        val entry = findUserEntry(connection, user)
        if(entry.isEmpty) {
          logger.debug(s"Auth: user [$user] is unknown (no LDAP entry found)")
        }

        entry.exists { entry: SearchResultEntry =>
          val resultCode = connection.bind(new SimpleBindRequest(entry.getDN, password)).getResultCode
          resultCode match {
            case ResultCode.SUCCESS => true
            case _ => throw new CalleeException(s"Auth: Unexpected ResultCode $resultCode while binding for [$user]")
          }
        }

      }, errorHandler)
  }

  override def getUser(userId: String): Option[LdapUser] = {
    managed2(createLdapConnection) { connection =>
      findUserEntry(connection, userId).map { entry =>
        LdapUser(userId, entry.getAttribute("displayName").getValue)
      }
    }
  }

  private def createLdapConnection = {
    val host = appConfig.ldapHost
    val port = appConfig.ldapPort
    val sslEnabled = appConfig.ldapSslEnabled
    if (sslEnabled) {
      logger.debug(s"Creating SSL connection to LDAP [$host:$port]")
      val tm = new TrustAllTrustManager
      val sslUtil = new SSLUtil(tm)
      val socketFactory = sslUtil.createSSLSocketFactory
      new LDAPConnection(socketFactory, host, port, appConfig.ldapBindUser, appConfig.ldapBindPassword)
    } else {
      logger.debug(s"Creating basic connection to LDAP [$host:$port]")
      new LDAPConnection(host, port)
    }
  }

  private def findUserEntry(connection: LDAPConnection, user: String): Option[SearchResultEntry] = {
    val baseDn = appConfig.ldapUserBaseDn
    val userNameAttr = appConfig.ldapUserNameAttr
    val searchScope = SearchScope.SUB

    val searchRequest = new SearchRequest(baseDn, searchScope, s"$userNameAttr=$user")
    val searchResult = connection.search(searchRequest)
    val searchEntries = searchResult.getSearchEntries
    searchEntries.asScala.headOption
  }
}