package com.directv.hw.core.plugin.web

import _root_.spray.routing._
import com.directv.hw.core.auth.UserSecurityContext
import ro.fortsoft.pf4j.ExtensionPoint

trait WebExtension extends ExtensionPoint {
  def route: UserSecurityContext => Route
}
