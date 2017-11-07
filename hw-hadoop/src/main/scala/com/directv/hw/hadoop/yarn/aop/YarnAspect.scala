package com.directv.hw.hadoop.yarn.aop

import com.directv.hw.aop.Aspect
import com.directv.hw.hadoop.config.ClusterServiceResolver
import com.directv.hw.hadoop.model.ClusterPath
import com.directv.hw.hadoop.yarn.YarnClient
import com.directv.hw.persistence.dao.ClusterServiceDao

class YarnAspect (val yarnClient: YarnClient,
                  val serviceResolver: ClusterServiceResolver,
                  val clusterServiceDao: ClusterServiceDao,
                  val clusterPath: ClusterPath) extends Aspect(yarnClient)