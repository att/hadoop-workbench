package com.directv.hw.hadoop.platform

trait PlatformMetadataService {
  @Deprecated
  def platformMeta(platformId: Int): String
  def platformMeta(`type`: PlatformTypes.Value): String
  def clusterMeta(platformId: Int): String
}
