package com.directv.hw.core.auth

import com.directv.hw.core.auth.SecurityFeatures.SecurityFeature

case class UserSecurityContext(user: String, features: Set[SecurityFeature]) {
  def isAllowed(feature: SecurityFeature): Boolean = {
    features.contains(feature)
  }
}
