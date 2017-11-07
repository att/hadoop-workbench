package com.directv.hw.web.listing.plugin

import com.directv.hw.common.web.WebCommon
import com.directv.hw.core.access.SrvUser
import com.directv.hw.core.auth.SecurityFeatures.clusterSettingsRead
import com.directv.hw.core.auth.SecurityFeatures.clusterSettingsWrite
import com.directv.hw.core.auth.UserSecurityContext
import com.directv.hw.hadoop.access._
import com.directv.hw.web.listing.model.{CreatedWebServiceUser, ServiceUsers}
import scaldi.{Injectable, Injector}
import spray.http.StatusCodes
import spray.routing.Route

trait SrvUsersRoute extends Injectable {
  self: WebCommon with PlatformWebConverter with PlatformJsonFormats =>

  private[plugin] val context: Injector
  private implicit val injector: Injector = context

  private val accessManager = inject[AccessManagerService]

  private[plugin] def usersRoute(userContext: UserSecurityContext,
                                 platformId: Option[Int] = None,
                                 clusterId: Option[String] = None): Route = {
    pathEndOrSingleSlash {
      parameter('owner.?) { owner =>
        authorize(userContext.isAllowed(clusterSettingsRead)) {
          get {
            complete(ServiceUsers(accessManager.findSrvUsers(platformId, clusterId, owner)))
          }
        }
      } ~
      authorize(userContext.isAllowed(clusterSettingsWrite)) {
        post {
          ensureEntity[SrvUser] { user =>
            complete {
              CreatedWebServiceUser(accessManager.addSrvUser(user.copy(platformId = platformId, clusterId = clusterId)))
            }
          }
        }
      }
    } ~
    path(IntNumber) { id =>
      authorize(userContext.isAllowed(clusterSettingsWrite)) {
        get {
          complete(accessManager.getSrvUser(id))
        }
      } ~
      authorize(userContext.isAllowed(clusterSettingsWrite)) {
        put {
          ensureEntity[SrvUser] { user =>
            complete {
              accessManager.updateSrvUser(user)
              StatusCodes.OK
            }
          }
        } ~
        delete {
          complete {
            accessManager.deleteSrvUser(id)
            StatusCodes.OK
          }
        }
      }
    }
  }
}
