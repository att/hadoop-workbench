package com.directv.hw.core.auth

import java.util.UUID

import com.directv.hw.core.auth.SecurityFeatures.SecurityFeature
import com.directv.hw.core.service.AppConf
import com.directv.hw.persistence.dao.{FeatureRolesDao, SessionDao, UserRolesDao}
import com.typesafe.scalalogging.LazyLogging
import org.joda.time.DateTime
import scaldi.{Injectable, Injector}

trait AuthService {
  def login(username: String, password: String, serviceAuth: Boolean): Option[String]
  def getUser(token: String): Option[String]
  def logout(token: String)
  def securityContext(user: String): UserSecurityContext
}

class AuthServiceImpl(implicit injector: Injector) extends AuthService
  with Injectable with LazyLogging {

  private val ldapClient = inject[LdapClient]
  private val sessionDao =  inject[SessionDao]
  private val userRolesDao = inject[UserRolesDao]
  private val featureRolesDao = inject[FeatureRolesDao]
  private val appConf = inject[AppConf]

  override def login(user: String, password: String, serviceAuth: Boolean): Option[String] = {
    if (ldapClient.verifyCredentials(user, password)) {
      val token = generateToken(user)
      sessionDao.storeSession(user, token)
      logger.debug(s"Created user token [$token] for user [$user]")
      sessionDao.removeOutdated(user, appConf.sessionTimeoutSec)
      Some(token)
    } else {
      None
    }
  }

  override def getUser(token: String): Option[String] = {
    sessionDao.findSession(token).flatMap { session =>
      if (DateTime.now().getMillis - session.timestamp.getMillis >  appConf.sessionTimeoutSec * 1000) {
        logger.debug(s"User token [$token] timeout after ${appConf.sessionTimeoutSec} seconds")
        sessionDao.deleteSession(token)
        None
      } else {
        sessionDao.storeSession(session.username, token)
        Some(session.username)
      }
    }
  }

  override def logout(token: String): Unit = {
    logger.debug(s"Deleting user token [$token]")
    sessionDao.deleteSession(token)
  }

  private def generateToken(user: String): String = {
    UUID.randomUUID().toString
  }

  override def securityContext(user: String): UserSecurityContext = {
    val roles = userRolesDao.find(user)
    val features = roles.map(featureRolesDao.features)
      .foldLeft(Set.empty[SecurityFeature])((features, next) => features ++ next)
    UserSecurityContext(user, features)
  }
}
