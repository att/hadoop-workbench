package com.directv.hw.web.admin

import com.directv.hw.common.web.{FilesRoute, WebCommon}
import com.directv.hw.core.auth.{SecurityFeatures, UserSecurityContext}
import com.directv.hw.core.plugin.web.WebExtension
import com.directv.hw.core.service.AppSettingsService
import com.directv.hw.core.settings.{UserRoleAssignment, UserRoles, Users, UsersRoleAssignments}
import com.directv.hw.hadoop.http.client.HttpDispatcher
import com.directv.hw.web.admin.model.{OngoingRequest, OngoingRequestList, WebMenuResponse, WebMenuSettings}
import com.typesafe.scalalogging.LazyLogging
import ro.fortsoft.pf4j.{Extension, Plugin, PluginDescriptor, PluginWrapper}
import scaldi.{Injectable, Injector}
import shapeless.HNil
import spray.http.StatusCodes
import spray.routing.Route

class AdminWebPlugin(pluginWrapper: PluginWrapper) extends Plugin(pluginWrapper)

@Extension
class AdminWebExtension(implicit injector: Injector) extends WebExtension with Injectable with LazyLogging
    with WebCommon with FilesRoute with AdminJsonFormats {

  implicit val di: AdminDiModule = new AdminDiModule()(injector)
  private val pluginInfo = inject[PluginDescriptor]
  private val settingsService = inject[AppSettingsService]
  private val httpDispatcher = inject[HttpDispatcher]

  override def route: UserSecurityContext => Route = { userContext: UserSecurityContext =>
    pathPrefix(pluginInfo.getPluginId) {
      pathPrefix("api" / "v1.0") {
        pathPrefix("platforms" / IntNumber) { platformId =>
          pathPrefix("clusters" / Segment) { clusterId =>
            path("conf") {
              def read = userContext.isAllowed(SecurityFeatures.clusterSettingsRead)
              def write = userContext.isAllowed(SecurityFeatures.clusterSettingsWrite)
              simpleFilesRoute(userContext, ClusterConfContentService(platformId, clusterId, userContext.user), read, write)
            }
          }
        } ~
        pathPrefix("admin") {
          path("conf") {
            def read = userContext.isAllowed(SecurityFeatures.applicationSettingsRead)
            def write = userContext.isAllowed(SecurityFeatures.applicationSettingsWrite)
            simpleFilesRoute(userContext, ConfigurationContentFS(userContext.user), read, write)
          }
        } ~
        path("menu") {
          val modelMenu = settingsService.getMenuSettings
          val webMenu = WebMenuSettings(modelMenu.disabled)
          val response = WebMenuResponse(webMenu)
          complete(response)
        } ~
        path("ongoing-requests") {
          complete {
            val requests = httpDispatcher.getOngoingRequests.map {
              case (url, start) => OngoingRequest(url, System.currentTimeMillis() - start)
            }

            OngoingRequestList(requests)
          }
        } ~
        pathPrefix("users") {
          pathEndOrSingleSlash {
            get {
              authorize(userContext.isAllowed(SecurityFeatures.userSettingsRead)) {
                complete(Users(settingsService.getUsers))
              }
            }
          } ~
          pathPrefix("roles") {
            pathEndOrSingleSlash {
              get {
                authorize(userContext.isAllowed(SecurityFeatures.userSettingsRead)) {
                  complete(UserRoles(settingsService.getUserRoles))
                }
              }
            } ~
            path("assignments") {
              get {
                authorize(userContext.isAllowed(SecurityFeatures.userSettingsRead)) {
                  complete {
                    val userRoles = settingsService.getUsersWithRoles.map { case (name, roles) =>
                      UserRoleAssignment(name, roles)
                    }.toList

                    UsersRoleAssignments(userRoles)
                  }
                }
              } ~
              put {
                authorize(userContext.isAllowed(SecurityFeatures.userSettingsWrite)) {
                  jsonEntity[UsersRoleAssignments] { usersRoles =>
                    complete {
                      val usersWithRoles = usersRoles.assignments.map { record => record.user -> record.roles }.toMap
                      settingsService.saveUsersWithRoles(usersWithRoles)
                      StatusCodes.OK
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}