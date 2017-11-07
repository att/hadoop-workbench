package com.directv.hw.hadoop.http.client

import java.util
import javax.security.auth.login.{AppConfigurationEntry, Configuration}

class LoginConfig(userPrincipal: String, keyTabLocation: String) extends Configuration {
  override def getAppConfigurationEntry(name: String): Array[AppConfigurationEntry] = {
    val options = new util.HashMap[String, AnyRef]
    options.put("useKeyTab", "true")
    options.put("keyTab", this.keyTabLocation)
    options.put("principal", this.userPrincipal)
    options.put("storeKey", "true")
    options.put("doNotPrompt", "true")
    options.put("isInitiator", "true")
    options.put("refreshKrb5Config", "true")
    Array(new AppConfigurationEntry("com.sun.security.auth.module.Krb5LoginModule", AppConfigurationEntry.LoginModuleControlFlag.REQUIRED, options))
  }
}
