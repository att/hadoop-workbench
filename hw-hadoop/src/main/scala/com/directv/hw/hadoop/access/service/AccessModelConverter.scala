package com.directv.hw.hadoop.access.service

import com.directv.hw.core.access.SrvUser
import com.directv.hw.hadoop.access.{ClusterSettings, CustomClusterProperty}
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.persistence.entity.{ClusterSettingsEntity, CustomClusterDataEntity}

trait AccessModelConverter {
  
  def toEntity(clusterPath: ClusterPath, settings: ClusterSettings): ClusterSettingsEntity = {
    ClusterSettingsEntity(clusterPath.platformId, clusterPath.clusterId, settings.kerberized, settings.realm)
  }

  def toModel(entity: ClusterSettingsEntity): ClusterSettings = {
    ClusterSettings(entity.kerberized, entity.realm)
  }

  def toModel(entity: CustomClusterDataEntity): CustomClusterProperty = {
    CustomClusterProperty(entity.key, entity.value, entity.description)
  }

  def toEntity(clusterPath: ClusterPath, model: CustomClusterProperty): CustomClusterDataEntity = {
    CustomClusterDataEntity(clusterPath.platformId, clusterPath.clusterId, model.key, model.value, model.description)
  }
}
