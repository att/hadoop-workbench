package com.directv.hw.core.web

import com.directv.hw.core.auth.SecurityFeatures.SecurityFeature
import com.directv.hw.core.auth.{LoginRequest, SecurityFeatures, Token, UserInfo}
import com.directv.hw.core.settings.{UserSettings, UserState}
import com.directv.hw.core.web.model.{Realm, Realms}
import spray.json._

trait AppJsonFormats extends DefaultJsonProtocol {
  implicit val loginRequestFormat = jsonFormat4(LoginRequest)
  implicit val tokenFormat = jsonFormat1(Token)
  implicit val userStateFormat = jsonFormat2(UserState)
  implicit val userSettingsFormat = jsonFormat5(UserSettings)
  implicit val realmFormat = jsonFormat1(Realm)
  implicit val realmsFormat = jsonFormat1(Realms)

  implicit object SecurityFeatureFormat extends RootJsonFormat[SecurityFeature] {
    override def read(json: JsValue): SecurityFeature = SecurityFeatures.fromString(json.convertTo[String])
    override def write(obj: SecurityFeature): JsValue = JsString(obj.toString)
  }

  implicit val userDataFormat = jsonFormat2(UserInfo)
}
