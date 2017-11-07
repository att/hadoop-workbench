package com.directv.hw.hadoop.platform.model

case class Api(`type`: String,
               version: Option[String] = None,
               host: String,
               port: Int,
               protocol: String,
               userName: Option[String] = None,
               password: Option[String] = None,
               keyId: Option[Int] = None)

object PlatformLocation {
  val amazon = "amazon"
  val onPremise = "on-premise"
}

case class Platform(id: Option[Int],
                    `type`: String,
                    version: String,
                    description: String,
                    location: String,
                    api: Api,
                    installationId: Option[String] = None)


case class ClusterInstallation(installationId: String,
                               clusterId: String,
                               distType: String,
                               title: String,
                               location: String,
                               distVersion: String,
                               managerUrl: Option[String],
                               managerUser: Option[String],
                               managerPassword: Option[String])