package com.directv.hw.hadoop.di

import java.io.File
import java.security.SecureRandom
import javax.net.ssl.{SSLContext, TrustManager}
import akka.actor.{ActorSystem, Props}
import akka.http.scaladsl.Http
import akka.stream.ActorMaterializer
import com.directv.hw.core.service.AppConf
import com.directv.hw.hadoop.access.AccessManagerService
import com.directv.hw.hadoop.access.service.AccessManagerServiceImpl
import com.directv.hw.hadoop.cloudera.routing.{ClouderaVersionRouter, ClouderaVersionRouterImpl}
import com.directv.hw.hadoop.config._
import com.directv.hw.hadoop.flume.cache.{FlumeUpdateActor, FlumeUpdateActorHolder}
import com.directv.hw.hadoop.flume.cloudera.ClouderaFlumeServiceFactory
import com.directv.hw.hadoop.flume.config.FlumeTemplateProcessor
import com.directv.hw.hadoop.flume.converter.{FlumeConverter, FlumeConverterImpl}
import com.directv.hw.hadoop.flume.hortonworks.HortonWorksFlumeServiceFactory
import com.directv.hw.hadoop.flume.routing.{FlumeServiceRouter, FlumeServiceRouterImpl}
import com.directv.hw.hadoop.flume.service.{FlumeLocalRepo, FlumeLocalRepoImpl}
import com.directv.hw.hadoop.hortonworks.client.{HdpClientImpl, HortonWorksClient}
import com.directv.hw.hadoop.http.client._
import com.directv.hw.hadoop.metrics.{MetricsAssignmentRepo, MetricsAssignmentRepoImpl}
import com.directv.hw.hadoop.oozie.job.YarnLogAggregator
import com.directv.hw.hadoop.platform.PlatformMetadataService
import com.directv.hw.hadoop.platform.cassandra.CassandraPlatformClient
import com.directv.hw.hadoop.platform.cloudera.ClouderaPlatformClientImpl
import com.directv.hw.hadoop.platform.hortonworks.HortonWorksPlatformClientImpl
import com.directv.hw.hadoop.platform.kafka.KafkaPlatformClient
import com.directv.hw.hadoop.platform.service._
import com.directv.hw.hadoop.platform.status._
import com.directv.hw.hadoop.ssh.routing.{RemoteAccessServiceRouter, SshServiceRouterImpl}
import com.directv.hw.hadoop.template.injest.flume.service.{FlumeElementTenantRepo, FlumeTenantRepo}
import com.directv.hw.hadoop.template.injest.oozie.service.{OozieComponentService, OozieNodeTenantRepo}
import com.directv.hw.hadoop.template.service.injest.flume.{FlumeElementTenantRepoImpl, FlumeTenantRepoImpl}
import com.directv.hw.hadoop.template.service.injest.oozie.{OozieComponentServiceImpl, OozieNodeTenantRepoImpl}
import com.directv.hw.hadoop.template.service.{TenantManager, TenantManagerImpl, TenantService, TenantServiceImpl}
import com.directv.hw.hadoop.yarn.{YarnClient, YarnClientImpl}
import scaldi.Module
import akka.http.scaladsl.HttpsConnectionContext
import com.directv.hw.core.concurrent.DispatcherFactory
import com.directv.hw.hadoop.aws.{AwsClientRouter, AwsClientRouterImpl}
import com.directv.hw.hadoop.deployment.{DeploymentService, DeploymentServiceImpl}
import scala.concurrent.ExecutionContext
import scala.concurrent.duration._
import scala.language.postfixOps

object HadoopDiReferences {
  val oozieIndexer = DiReferences.oozieIndexer
}

object HadoopModules {
  val context = CommonModule :: PlatformModule :: ClouderaModule :: OozieModule :: FlumeModule :: HdfsModule ::
    HttpModule :: TemplateModule :: SshModule :: HortonWorksModule :: ConfigModule :: YarnModule :: MetricsModule
}

object CommonModule extends Module {
  bind[AccessManagerService] to new AccessManagerServiceImpl
  bind[MustacheClusterDictionary] to new MustacheClusterDictionaryImpl
}

object ClouderaModule extends Module {

  lazy val clouderaClientPlugins = Map (
    "3" -> "cdh4-service",
    "4" -> "cdh4-service",
    "5" -> "cdh4-service"
  )

  bind[ClouderaVersionRouter] to new ClouderaVersionRouterImpl(clouderaClientPlugins)
}

object HortonWorksModule extends Module {
  implicit lazy val dispatcher: ExecutionContext = inject[DispatcherFactory].dispatcher
  bind[HortonWorksClient] to new HdpClientImpl(inject[HttpDispatcher])
}

object PlatformModule extends Module {
  private lazy val appConf = inject[AppConf]
  private lazy val clientRouters = Map (
    "CDH" -> ((platformId: Int) => new ClouderaPlatformClientImpl(platformId)),
    "HDP" -> ((platformId: Int) => new HortonWorksPlatformClientImpl(platformId)),
    "KAFKA" -> ((platformId: Int) => new KafkaPlatformClient(platformId)),
    "CASSANDRA" -> ((_: Int) => new CassandraPlatformClient)
  )

  bind[PlatformManager] to new PlatformManagerImpl(clientRouters)
  bind[ClientSitePropsFactory] to new ClientSitePropsFactoryImpl
  bind[PlatformMetadataService] to new PlatformMetadataServiceImpl

  private lazy val actorSystem = inject[ActorSystem]
  private lazy val pingStatusActor = actorSystem.actorOf(Props(new PingRequestActor))
  bind[PingStatusActorHolder] to PingStatusActorHolder(pingStatusActor)

  bind[PlatformStatusService] to new PlatformStatusServiceImpl
  bind[ClusterInstallationService] to new ClusterInstallationServiceImpl
  bind[ClusterConfigService] to new ClusterConfigServiceImpl(appConf.repositoryDir, clientRouters)
  bind[ClusterServiceResolver] to new ClusterServiceResolverImpl
}

object FlumeModule extends Module {
  lazy val config = inject[AppConf]
  lazy val repositoryPath = config.repositoryDir

  lazy val permFilesLocation = new File(new File(repositoryPath), "flume")

  lazy val flumeServices = Map(
    "CDH" -> new ClouderaFlumeServiceFactory,
    "HDP" -> new HortonWorksFlumeServiceFactory
  )

  bind [FlumeConverter] to new FlumeConverterImpl
  bind [FlumeServiceRouter] to new FlumeServiceRouterImpl(flumeServices)
  bind [FlumeLocalRepo] to new FlumeLocalRepoImpl(permFilesLocation, config.accessKeyDir)
  bind [FlumeConfigurationProcessor] to new FlumeTemplateProcessor

  lazy val actorSystem = inject[ActorSystem]
  lazy val flumeCache = actorSystem.actorOf(Props(new FlumeUpdateActor))
  bind [FlumeUpdateActorHolder] to FlumeUpdateActorHolder(flumeCache)
}

object SshModule extends Module {
  bind [RemoteAccessServiceRouter] to new SshServiceRouterImpl
}

object ConfigModule extends Module {
  bind [DescriptorConverter] to new DescriptorConverterImpl
}

object TemplateModule extends Module {

  lazy val config = inject[AppConf]
  bind[TenantManager] to new TenantManagerImpl(config.tenantsDir)
  bind[OozieNodeTenantRepo] to new OozieNodeTenantRepoImpl
  bind[OozieComponentService] to new OozieComponentServiceImpl
  bind[FlumeTenantRepo] to new FlumeTenantRepoImpl
  bind[FlumeElementTenantRepo] to new FlumeElementTenantRepoImpl

  lazy val templateServices = List (
    inject[OozieNodeTenantRepo],
    inject[OozieComponentService],
    inject[FlumeTenantRepo],
    inject[FlumeElementTenantRepo]
  )

  bind[TenantService] to new TenantServiceImpl(templateServices)
  bind[AwsClientRouter] to new AwsClientRouterImpl("aws-service")
  bind[DeploymentService] to new DeploymentServiceImpl
}

object HttpModule extends Module {
  lazy implicit val actorSystem = inject[ActorSystem]
  lazy implicit val materializer: ActorMaterializer = ActorMaterializer()
  lazy val appConf = inject[AppConf]

  lazy val sslContext = {
    val context = SSLContext.getInstance("SSL")
    context.init(null, Array[TrustManager](new AllTrustedManager), new SecureRandom())
    context
  }

  bind[ActorMaterializer] to materializer
  lazy val pool = Http(actorSystem).superPool[RequestContext](connectionContext = new HttpsConnectionContext(sslContext))
      .completionTimeout(appConf.outgoingHttpRqTimeoutMs milliseconds)
  bind[HttpPool] to HttpPool(pool)
  bind[SpNegoTokenGenerator] to new SpNegoTokenGeneratorImpl
  bind [HttpDispatcher] to new HttpDispatcherImpl
}

object YarnModule extends Module {
  bind [YarnClient] to new YarnClientImpl
  bind [YarnLogAggregator] to new YarnLogAggregator
}

object MetricsModule extends Module {
  bind [MetricsAssignmentRepo] to new MetricsAssignmentRepoImpl
}
