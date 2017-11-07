package com.directv.hw.core.web

import akka.actor.ActorSystem
import com.directv.hw.common.web.WebCommon
import com.directv.hw.core.service.AppConf
import com.directv.hw.core.auth._
import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.core.exception.AuthenticationException
import com.directv.hw.core.http.RequestIdGenerator
import com.directv.hw.core.plugin.DapPluginManager
import com.directv.hw.core.plugin.web.WebExtension
import com.directv.hw.core.settings.{SettingsService, UserSettings, UserState}
import com.directv.hw.core.web.model.{Realm, Realms}
import com.directv.hw.hadoop.access.AccessManagerService
import com.directv.hw.logging.AuditLogging
import com.typesafe.scalalogging.LazyLogging
import scaldi.{Injectable, Injector}
import spray.http._
import spray.routing._
import spray.routing.directives.{DebuggingDirectives, LoggingMagnet}

import scala.language.postfixOps

class RestRouter(implicit injector: Injector)
  extends WebCommon with AppJsonFormats with Injectable with LazyLogging with AuditLogging {

  private val appConf = inject[AppConf]
  private val authService = inject[AuthService]
  private val settingsService = inject[SettingsService]
  private val pluginManager = inject[DapPluginManager]
  private val actorSystem = inject[ActorSystem]
  private val accessManager = inject[AccessManagerService]
  private val userSettingsService = inject[SettingsService]
  private val dispatcherFactory = inject[DispatcherFactory]
  private val idGenerator = inject[RequestIdGenerator]

  val route: Route =
    authRoute ~
    logIncomingRequestResponse() {
      settingsRoute ~ uiSettingsRoute ~ moduleRoute(webExtensionRoutes)
    }


  private def printRequestMethod(logBody: Boolean)(req: HttpRequest): Any => Unit = {
    val id = idGenerator.nextRequestId()
    logger.debug(s"Incoming HTTP request [$id] ${req.method} ${req.uri}" +
      traceMsgOption(logBody, req.entity, req.headers).map("\n\n" + _).getOrElse("") + "\n")

    printResponseMethod(id, logBody)
  }

  private def printResponseMethod(id: Long, logBody: Boolean)(resp: Any): Unit = {
    resp match {
      case HttpResponse(status, entity, headers, _) =>
        logger.debug(s"Outgoing HTTP response [$id] $status" +
          traceMsgOption(logBody, entity, headers).getOrElse("") + "\n")

      case unknown => logger.debug(s"Outgoing HTTP response [$id] of unknown type [${resp.getClass}]")
    }
  }

  private def traceMsgOption(logBody: Boolean, entity: HttpEntity, headers: List[HttpHeader]) = {
    val traceMsg = if (logger.underlying.isTraceEnabled && logBody) {
      val body = entity match {
        case HttpEntity.NonEmpty(contentType, data) if contentType.mediaType == MediaTypes.`application/json` =>
          Some(data.asString)
        case _ => None
      }

      val headersMsg = headers.mkString("\n")
      Some(headersMsg + body.map("\n\n" + _).getOrElse(""))
    } else {
      None
    }
    traceMsg
  }

  private def logIncomingRequestResponse(logBody: Boolean = true) =
    DebuggingDirectives.logRequestResponse(LoggingMagnet(printRequestMethod(logBody)))


  private def authRoute =
    pathPrefix("auth") {
      logIncomingRequestResponse(false) {
        path("realms") {
          get {
            complete(Realms(accessManager.getAllClusterRealms.map(Realm)))
          }
        } ~
        pathPrefix("login") {
          post {
            ensureEntity[LoginRequest] { login =>
              completeWithAudit(login.username, "LOGIN") {
                authService.login(login.username, login.password, login.serviceLogin.contains(true)).map { token =>
                  loginAction(login)
                  Token(token)
                }.getOrElse(throw AuthenticationException("login failed"))
              }
            }
          }
        } ~
        pathPrefix("getUser") {
          get {
            ensureAuth { userContext =>
              complete {
                UserInfo(userContext.user, userContext.features)
              }
            }
          }
        } ~
        pathPrefix("logout") {
          post {
            headerValueByName("Authorization") { token =>
              complete {
                val user = authService.getUser(token).getOrElse("")
                auditLogger.info(user, "LOGOUT", s"token=$token")
                authService.logout(token)
                StatusCodes.OK
              }
            } ~
            complete(StatusCodes.Unauthorized)
          }
        }
      }
    }

  private def loginAction(login: LoginRequest): Unit = {
    accessManager.generateClusterCreds(login.username, login.password)
  }

  private def settingsRoute =
    pathPrefix("settings" / "user" / Segment) { user =>
      ensureAuth { userContext =>
        pathEndOrSingleSlash {
          get {
            complete {
              settingsService.getUserSettings(user).getOrElse(UserSettings(user, ""))
                .asInstanceOf[UserSettings]
            }
          } ~
          put {
            ensureEntity[UserSettings] { settings =>
              complete {
                settingsService.saveUserSettings(settings)
                StatusCodes.OK
              }
            }
          } ~
          delete {
            complete {
              settingsService.deleteUserSettings(user)
              StatusCodes.OK
            }
          }
        } ~
        path("state") {
          get {
            complete {
              settingsService.getUserState(user).getOrElse(UserState(user, ""))
                .asInstanceOf[UserState]
            }
          } ~
          put {
            ensureEntity[UserState] { state =>
              complete {
                settingsService.saveUserState(state)
                StatusCodes.OK
              }
            }
          } ~
          delete {
            complete {
              settingsService.deleteUserState(user)
              StatusCodes.OK
            }
          }
        }
      }
    }

  private def uiSettingsRoute =
    pathPrefix("settings" / "ui") {
      ensureAuth { userContext =>
        get {
          complete(appConf.uiSettings)
        }
      }
    }

  private def moduleRoute(extensionRoutes: List[UserSecurityContext => Route]) =
    pathPrefix("module") {
      ensureAuth { userContext =>
        detach(dispatcherFactory.auxiliaryDispatcher) {
          extensionRoutes.map(_(userContext)).reduce(_ ~ _)
        }
      }
    }

  private def webExtensionRoutes: List[(UserSecurityContext) => Route] = {
    val descriptors = pluginManager.getExtensionWrappers[WebExtension]
    descriptors.map { descriptor =>
      val clazz = descriptor.getExtensionClass.asInstanceOf[Class[WebExtension]]
      logger.debug(s"Found web extension ${clazz.getName}")

      val constructor = clazz.getConstructor(classOf[Injector])
      val webExtension = constructor.newInstance(injector)

      logger.debug(s"Web extension - ${webExtension.getClass.getName} has been initialized")
      webExtension.route
    }
  }

  private def ensureAuth(routeForUser: UserSecurityContext => Route): Route = {
    def authByToken: String => Route = { token =>
      try {
        authService.getUser(token)
          .map(authService.securityContext)
          .map(routeForUser(_))
          .getOrElse(complete(StatusCodes.Unauthorized))
      } catch {
        case e: Throwable => complete{ throw e }
      }
    }

    handleRejections(RejectionHandler.Default) {
      headerValueByName("Authorization")(authByToken) ~
      get {
        parameter("Authorization")(authByToken)
      } ~
      post {
        formFields('Authorization)(authByToken)
      }
    } ~
    complete(StatusCodes.Unauthorized)
  }
}
