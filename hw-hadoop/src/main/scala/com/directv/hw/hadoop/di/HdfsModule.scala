package com.directv.hw.hadoop.di

import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.hdfs.{HdfsServiceFactory, HdfsServiceFactoryImpl}
import scaldi.Module

object HdfsModule extends Module {

  lazy val hdfsPlugins = Map(
    ("CDH", "3") -> "hdfs-service",
    ("CDH", "4") -> "hdfs-service",
    ("CDH", "5") -> "hdfs-service",
    ("HDP", "2") -> "hdfs-service",
    ("HDP", "3") -> "hdfs-service"
  )

  lazy val appConf = inject[AppConf]
  bind[HdfsServiceFactory] to new HdfsServiceFactoryImpl
}
