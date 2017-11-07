package com.directv.hw.core.auth

import com.directv.hw.util.ParameterEnumeration

object SecurityFeatures extends ParameterEnumeration {
  type SecurityFeature = Value
  val clusterSettingsRead: Value = Value("CLUSTER_SETTINGS_READ")
  val clusterSettingsWrite: Value = Value("CLUSTER_SETTINGS_WRITE")
  val applicationSettingsRead: Value = Value("APP_SETTINGS_READ")
  val applicationSettingsWrite: Value = Value("APP_SETTINGS_WRITE")
  val userSettingsRead: Value = Value("USER_SETTINGS_READ")
  val userSettingsWrite: Value = Value("USER_SETTINGS_WRITE")
}
