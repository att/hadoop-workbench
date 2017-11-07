package com.directv.hw.core.auth

import com.directv.hw.core.service.AppConf
import com.typesafe.scalalogging.LazyLogging
import org.scalamock.scalatest.MockFactory
import org.scalatest.{Matchers, FlatSpec}
import scaldi.Module

class LdapClientSpec extends FlatSpec with Matchers with MockFactory with LazyLogging {

  val appConf = mock[AppConf]

  implicit object TestModule extends Module {
    bind [AppConf] to appConf
  }

  (appConf.ldapHost _).expects().returns("10.26.76.122")
  (appConf.ldapPort _).expects().returns(636)
  (appConf.ldapSslEnabled _).expects().returns(true)
  (appConf.ldapBindUser _).expects().returns("svc.ampip.dv.ldap@ds.dtveng.net")
  (appConf.ldapBindPassword _).expects().returns("")
  (appConf.ldapUserBaseDn _).expects().returns("ou=BIAS Accounts,dc=ds,dc=dtveng,dc=net")
  (appConf.ldapUserNameAttr _).expects().returns("cn")

  ignore should "search for user (BIAS)" in {

    val ldapService = new LdapClientImpl(appConf)
    val entry: Option[LdapUser] = ldapService.getUser("d511982")
    entry shouldBe defined
    entry.foreach { entry =>
      logger.debug(s"user name - ${entry.name}")
    }
  }
}
