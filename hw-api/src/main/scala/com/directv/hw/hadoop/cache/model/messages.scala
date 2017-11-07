package com.directv.hw.hadoop.cache.model

import com.directv.hw.hadoop.model.ModulePath
import com.directv.hw.hadoop.platform.model.{ClusterInfo, FullModuleInfo, PlatformInfo, ServiceInfo}

case object GetCachedModules
case class CachedModules(modules: List[FullModuleInfo])

case object GetServiceStructure

case class ClusterStructure(info: ClusterInfo, services: List[ServiceInfo])
case class PlatformStructure(info: PlatformInfo, clusters: List[ClusterStructure])
case class PlatformsStructure(platforms: List[PlatformStructure])

case class AddPlatform(platform: PlatformInfo)

case class RemovePlatform(platformId: Int)


sealed trait CachedModuleUpdate {
  def modulePath: ModulePath
}
case class UpdateCachedModule(modulePath: ModulePath, module: Any) extends CachedModuleUpdate
case class RemoveCachedModule(modulePath: ModulePath) extends CachedModuleUpdate
