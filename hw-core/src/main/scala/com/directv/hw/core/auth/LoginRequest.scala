package com.directv.hw.core.auth

import com.directv.hw.core.auth.SecurityFeatures.SecurityFeature

case class LoginRequest(username: String,
                        password: String,
                        serviceLogin: Option[Boolean] = None,
                        realm: Option[String] = None)

case class Token(token: String)

case class UserInfo(username: String, features: Set[SecurityFeature])