package com.directv.hw.web.listing.plugin

import com.directv.hw.common.web.{StreamEntity, WebCommon}
import com.directv.hw.core.auth.SecurityFeatures.clusterSettingsRead
import com.directv.hw.core.auth.SecurityFeatures.clusterSettingsWrite
import com.directv.hw.core.auth.UserSecurityContext
import com.directv.hw.core.exception.NotSupportedException
import com.directv.hw.hadoop.access._
import com.directv.hw.web.listing.model.KeyFileListWO
import scaldi.{Injectable, Injector}
import spray.http.StatusCodes
import spray.routing.Route

trait KeyRoute extends Injectable {
  self: WebCommon with PlatformWebConverter with PlatformJsonFormats =>

  private[plugin] val context: Injector
  private implicit val injector: Injector = context

  private val accessManager = inject[AccessManagerService]

  private[plugin] def keyRoute(userContext: UserSecurityContext,
                               platformId: Option[Int] = None,
                               clusterId: Option[String] = None): Route = {
    pathPrefix(IntNumber) { id =>
      get {
        authorize(userContext.isAllowed(clusterSettingsRead)) {
          complete(toWeb(accessManager.getKeyFileById(id)._1))
        }
      } ~
      delete {
        authorize(userContext.isAllowed(clusterSettingsWrite)) {
          complete {
            accessManager.deleteKeyFile(id)
            StatusCodes.OK
          }
        }
      } ~
      put {
        authorize(userContext.isAllowed(clusterSettingsWrite)) {
          jsonEntity[KeyFileInfo] { key =>
            complete {
              accessManager.updateKeyFile(key)
              StatusCodes.OK
            }
          }
        }
      }
    } ~
    get {
      authorize(userContext.isAllowed(clusterSettingsRead)) {
        parameter('type, 'owner.?) { (`type`, owner) =>
          complete {
            KeyFileListWO(accessManager.getKeys (
              `type`,
              owner,
              platformId = platformId,
              clusterId = clusterId
            ).map(toWeb))
          }
        }
      }
    } ~
    post {
      authorize(userContext.isAllowed(clusterSettingsWrite)) {
        parameter('operation) {
          case "create" =>
            parameters('type, 'name, 'owner.?) { (`type`, name, owner) =>
              ensureEntity[CreateKeyFile] { createKey =>
                KeyTypes.withName(`type`) match {
                  case KeyTypes.keyTab =>
                    complete {
                      val key = KeyFile(
                        None,
                        KeyTypes.keyTab,
                        name = name,
                        owner = owner,
                        platformId = platformId,
                        clusterId = clusterId
                      )

                      KeyFileId(accessManager.createKeyTab(createKey.principal, createKey.password, key))
                    }

                  case unknown => throw new NotSupportedException("not supported key type - " + unknown)
                }
              }
            }

          case "upload" =>
            parameters('type, 'name, 'owner.?) { (`type`, name, owner) =>
              ensureEntity[StreamEntity] { data =>
                complete {
                  val key = KeyFile(
                    None, `type`, name,
                    owner = owner,
                    platformId = platformId,
                    clusterId = clusterId
                  )

                  KeyFileId(accessManager.uploadKeyFile(key, data.items.head))
                }
              }
            }
        }
      }
    }
  }
}
