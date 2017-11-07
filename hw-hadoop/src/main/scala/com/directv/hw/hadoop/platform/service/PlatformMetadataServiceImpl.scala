package com.directv.hw.hadoop.platform.service

import com.directv.hw.common.io.DapIoUtils
import com.directv.hw.core.exception.NotSupportedException
import com.directv.hw.hadoop.platform.{PlatformMetadataService, PlatformTypes}
import com.directv.hw.persistence.dao.PlatformDao
import scaldi.{Injectable, Injector}

class PlatformMetadataServiceImpl(implicit ijector: Injector) extends PlatformMetadataService with Injectable {

  private val platformDao = inject[PlatformDao]

  @Deprecated
  override def platformMeta(platformId: Int): String = {
    val platform = platformDao.findPlatformById(platformId)._1
    platformMeta(platform.`type`)
  }

  override def platformMeta(`type`: PlatformTypes.Value): String = {
    try {
      `type` match {
        case PlatformTypes.CDH => DapIoUtils.loadResourceAsString(getClass, "platform/metadata/cdh.json")
        case PlatformTypes.HDP => DapIoUtils.loadResourceAsString(getClass, "platform/metadata/hdp.json")
        case PlatformTypes.Cassandra => DapIoUtils.loadResourceAsString(getClass, "platform/metadata/cassandra.json")
        case PlatformTypes.Kafka => DapIoUtils.loadResourceAsString(getClass, "platform/metadata/kafka.json")
      }
    } catch {
      case e: NoSuchElementException => throw new NotSupportedException(s"Unknown platform type [${`type`}]")
    }
  }

  override def clusterMeta(platformId: Int): String = {
    val platform = platformDao.findPlatformById(platformId)._1
    val `type` = platform.`type`
    val version = platform.version

    try {
      PlatformTypes.fromString(`type`) match {
        case PlatformTypes.CDH => cdhClusterMeta(version)
        case PlatformTypes.HDP => hpdClusterMeta(version)
        case PlatformTypes.Kafka => kafkaClusterMeta(version)
      }
    } catch {
      case e: NoSuchElementException => throw new NotSupportedException(s"Unknown platform type [${`type`}]")
    }
  }

  private def cdhClusterMeta(version: String) = {
    val majorStr = version.split("\\.")(0)
    val major = try {
      majorStr.toInt
    } catch {
      case e: NumberFormatException => throw new NotSupportedException(s"CDH major version should be numeric [$majorStr]")
    }

    if (major < 3) throw new NotSupportedException("no metadata for CDH less that 3-rd version ")

    val metaResource = major match {
      case m if m > 4 => "platform/metadata/cluster_yarn.json"
      case _ => "platform/metadata/cluster_mr1.json"
    }

    DapIoUtils.loadResourceAsString(getClass, metaResource)
  }

  private def hpdClusterMeta(version: String) = {
    DapIoUtils.loadResourceAsString(getClass, "platform/metadata/cluster_yarn.json")
  }

  private def kafkaClusterMeta(version: String) = {
    DapIoUtils.loadResourceAsString(getClass, "platform/metadata/cluster_kafka.json")
  }
}
