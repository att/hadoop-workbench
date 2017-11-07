package com.directv.hw.persistence.di

import java.nio.file.Paths

import com.directv.hw.core.service.AppConf
import com.directv.hw.persistence.dao._
import com.mchange.v2.c3p0.{ComboPooledDataSource, PooledDataSource}
import scaldi.Module

object PersistenceModules {
  val context = DBModule
}

object DBModule extends Module {
  import scala.slick.jdbc.JdbcBackend.Database

  lazy val conf = inject[AppConf]
  lazy val dataSource = {
    val dataSource = new ComboPooledDataSource()
    dataSource.setDriverClass(conf.dbDriver)
    dataSource.setJdbcUrl(conf.dbUrl)
    dataSource.setUser(conf.dbUser)
    dataSource.setPassword(conf.dbPassword)
    dataSource.setMaxIdleTime(conf.dbWaitTimeout)
    dataSource
  }

  bind [PooledDataSource] to dataSource

  lazy val db = Database.forDataSource(dataSource)
  lazy val driver = scala.slick.driver.MySQLDriver
  bind [PlatformDao] to new PlatformDaoImpl(driver, db)
  bind [ClusterDao] to new ClusterDaoImpl(driver, db)
  bind [SessionDao] to new SessionDaoImpl(driver, db)
  bind [PropertyDao] to new PropertyDaoImpl(driver, db)
  bind [HdfsAccessDao] to new HdfsAccessDaoImpl(driver, db)
  bind [OozieAccessDao] to new OozieAccessDaoImpl(driver, db)
  bind [OozieWorkflowDao] to new OozieWorkflowDaoImpl(driver, db)
  bind [TenantDao] to new TenantDaoImpl(driver, db)
  bind [TemplateInfoDao] to new TemplateInfoDaoImpl(driver, db)
  bind [OozieNodeTemplateDao] to new OozieNodeTemplateDaoImpl(driver, db)
  bind [OozieTemplateDao] to new OozieTemplateDaoImpl(driver, db)
  bind [FlumeTemplateDao] to new FlumeTemplateDaoImpl(driver, db)
  bind [HostDao] to new HostDaoImpl(driver, db)
  bind [KeyStoreDao] to new KeyStoreDaoImpl(driver, db, conf.accessKeyDir)
  bind [PlatformAccessDao] to new PlatformAccessDaoImpl(driver, db)
  bind [FlumeElementTemplateDao] to new FlumeElementTemplateDaoImpl(driver, db)
  bind [SettingsDao] to new SettingsDaoImpl(driver, db)
  bind [ServiceUserDao] to new ServiceUserDaoImpl(driver, db)
  bind [CustomClusterDataDao] to new CustomClusterDataDaoImpl(driver, db)
  bind [FlumeComponentDao] to new FlumeComponentDaoImpl(driver, db)
  bind [MetricsAssignmentDao] to new MetricsAssignmentDaoImpl(driver, db)
  bind [ProvisionStateDao] to new ProvisionStateDaoImpl(driver, db)
  bind [PlatformInstallationDao] to new PlatformInstallationDaoImpl(driver, db)
  bind [ClusterConfigUpdateDao] to new ClusterConfigUpdateDaoImpl(driver, db)
  bind [ClusterServiceDao] to new ClusterServiceDaoImpl(driver, db)
  bind [UserRolesDao] to new UserRolesDaoImpl(driver, db)
  bind [FeatureRolesDao] to new FeatureRolesDaoImpl(driver, db)
}