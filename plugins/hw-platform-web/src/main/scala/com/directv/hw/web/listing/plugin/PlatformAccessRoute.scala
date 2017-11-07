package com.directv.hw.web.listing.plugin

import com.directv.hw.common.web.WebCommon
import com.directv.hw.core.auth.SecurityFeatures.clusterSettingsRead
import com.directv.hw.core.auth.UserSecurityContext
import com.directv.hw.hadoop.access._
import com.directv.hw.hadoop.host.model.PlatformHostAccess
import com.directv.hw.web.listing.model.ShortWebHostAccess
import scaldi.{Injectable, Injector}
import spray.http.StatusCodes
import spray.routing.Route

import scala.language.postfixOps

trait PlatformAccessRoute extends Injectable {
  self: WebCommon with PlatformWebConverter with PlatformJsonFormats =>

  private[plugin] val context: Injector
  private implicit val injector: Injector = context

  private val accessManager = inject[AccessManagerService]

  private[plugin] def platformAccessRoute(userContext: UserSecurityContext, platformId: Int): Route = {
    authorize(userContext.isAllowed(clusterSettingsRead)) {
      get {
        parameter("view"?) { view =>
          complete {
            val access = accessManager.findPlatformAccess(platformId)
            view match {
              case Some("short") =>
                ShortWebHostAccess(access map (_.pluginDirs) getOrElse List.empty)
              case _ =>
                access
            }
          }
        }
      }
    } ~
    authorize(userContext.isAllowed(clusterSettingsRead)) {
      put {
        ensureEntity[PlatformHostAccess] { access =>
          complete {
            accessManager.savePlatformAccess(access.copy(id = Some(platformId)))
            StatusCodes.OK
          }
        }
      } ~
      delete {
        complete {
          accessManager.deletePlatformAccess(platformId)
          StatusCodes.OK
        }
      }
    }
  }
}
