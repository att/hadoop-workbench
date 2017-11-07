package com.directv.hw.web.provision

import akka.actor.ActorSystem
import com.directv.hw.common.io.DapIoUtils
import com.directv.hw.common.web.WebCommon
import com.directv.hw.core.auth.UserSecurityContext
import com.directv.hw.core.exception.NotSupportedException
import com.directv.hw.core.plugin.web.WebExtension
import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.provision.model.ProvisionUrls
import com.typesafe.scalalogging.LazyLogging
import ro.fortsoft.pf4j.{Extension, Plugin, PluginDescriptor, PluginWrapper}
import scaldi.{Injectable, Injector}
import spray.http.StatusCodes
import spray.json._
import spray.routing.Route

class ProvisionWebPlugin(pluginWrapper: PluginWrapper) extends Plugin(pluginWrapper)

@Extension
class ProvisionWebExtension(implicit injector: Injector) extends WebExtension with Injectable with LazyLogging
    with WebCommon with JsonFormats {

  private implicit val di = new DiModule()(injector)
  private implicit val actorSystem = inject[ActorSystem]

  private val appConf = inject[AppConf]
  private val pluginInfo = inject[PluginDescriptor]

  override def route: UserSecurityContext => Route = { userContext: UserSecurityContext =>
    pathPrefix(pluginInfo.getPluginId) {
      pathPrefix("api" / "v1.0") {
        pathPrefix("urls") {
          complete(ProvisionUrls(appConf.provisionUrls))
        }
      }
    }
  }
}