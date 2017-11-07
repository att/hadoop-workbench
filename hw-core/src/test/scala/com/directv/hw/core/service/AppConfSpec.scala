package com.directv.hw.core.service

import com.directv.hw.core.conf.AppConfImpl._
import com.directv.hw.core.conf.{AppConfImpl, LoggerConfiguratorImpl}
import org.scalatest.{BeforeAndAfter, FlatSpec, Matchers}

import scala.reflect.io.File

class AppConfSpec extends FlatSpec with Matchers with BeforeAndAfter {

  val sep = File.separator
  val userHome = System.getProperty("user.home")
  val loginConfigurator = new LoggerConfiguratorImpl

  val defaultEnvSet = Map(appHomeEnvProp -> absPath("hw_base"), siteEnvProp -> "site", userEnvProp -> "user")
  val envSetOverride = Map(appHomeEnvProp -> absPath("hw_base_override"), siteEnvProp -> "site", userEnvProp -> "user")
  val envSetSiteOverride = Map(appHomeEnvProp -> absPath("hw_base_site_override"), siteEnvProp -> "site", userEnvProp -> "user")
  val envSetUserOverride = Map(appHomeEnvProp -> absPath("hw_base_user_override"), siteEnvProp -> "site", userEnvProp -> "user")


  "appConf" should "return plugin dir (default)" in {
    val conf = new AppConfImpl(defaultEnvSet, loginConfigurator)
    conf.pluginDir should be(absPath("hw_base") + sep + "plugins")
  }

  "appConf" should "return default hw.startup.oozie.indexation.enabled (default)" in {
    val conf = new AppConfImpl(defaultEnvSet, loginConfigurator)
    conf.startupOozieIndexation should be (right = false)
  }

  "appConf" should "return default hw.startup.oozie.indexation.enabled (override)" in {
    val conf = new AppConfImpl(envSetOverride, loginConfigurator)
    conf.startupOozieIndexation should be (right = false)
  }

  "appConf" should "return db user (override)" in {
    val conf = new AppConfImpl(defaultEnvSet, loginConfigurator)
    conf.dbUser should be ("test")
  }

  "appConf" should "return db password (override)" in {
    val conf = new AppConfImpl(defaultEnvSet, loginConfigurator)
    conf.dbPassword should be ("test")
  }

  "appConf" should "return db url (override)" in {
    val conf = new AppConfImpl(defaultEnvSet, loginConfigurator)
    conf.dbUrl should be ("jdbc:mysql://localhost:3306/TEST")
  }

  "appConf" should "return app user (default)" in {
    val conf = new AppConfImpl(defaultEnvSet, loginConfigurator)
    conf.appUser should be ("hw")
  }

  "appConf" should "return app user (override)" in {
    val conf = new AppConfImpl(envSetOverride, loginConfigurator)
    conf.appUser should be ("test")
  }

  "appConf" should "return app user (site override)" in {
    val conf = new AppConfImpl(envSetSiteOverride, loginConfigurator)
    conf.appUser should be ("site")
  }

  "appConf" should "return app user (user override)" in {
    val conf = new AppConfImpl(envSetUserOverride, loginConfigurator)
    conf.appUser should be ("user")
  }

  def absPath(resource: String): String = {
    new java.io.File(getClass.getClassLoader.getResource(resource).toURI).getAbsolutePath
  }
}