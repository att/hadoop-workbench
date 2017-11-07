package com.directv.hw.hadoop.hdp

import akka.http.scaladsl.model.{StatusCodes, HttpMethods, Uri}
import akka.util.Timeout
import com.directv.hw.hadoop.hdp.JsonResponses._
import com.directv.hw.hadoop.hortonworks.client._
import com.directv.hw.hadoop.http.client.{HttpClientResponse, HttpDispatcher}
import com.directv.hw.hadoop.platform.hortonworks.HortonWorksPlatformClientImpl._
import com.typesafe.scalalogging.LazyLogging
import org.scalamock.scalatest.MockFactory
import org.scalatest.{FlatSpec, Matchers}
import scaldi.Module
import scala.concurrent.duration._
import scala.concurrent.{Await, Future}
import scala.util.{Success, Failure}

class HdpClientSpec extends FlatSpec with Matchers with LazyLogging with MockFactory  {

  implicit val timeout = Timeout(45.seconds)
  implicit val dispatcher = scala.concurrent.ExecutionContext.Implicits.global

  val mockRequestDispatcher = mock[HttpDispatcher]

  implicit object TestModule extends Module {
    bind[HttpDispatcher] to mockRequestDispatcher
  }

  val user = "admin"
  val password = "admin"
  val host = "nn.com"
  val port = 8080
  val url = s"http://$host:$port"
  val id = 1L
  val clusterId = "Cluster"
  val HdpClient = new HdpClientImpl(mockRequestDispatcher)

  implicit val conn = ConnectionInfo(url, "user", "pass")

  "Response" should "return clusters" in {
    val uri = Uri(s"http://$host:$port/api/v1/clusters?fields=Clusters/cluster_id&Clusters/cluster_name")
    (mockRequestDispatcher.submitRequest _).expects(HttpMethods.GET, uri, *, *, *).returns {
      Future(response(getClusters))
    }
    val future = HdpClient.getClusters(conn)
    val res = Await.result(future, 45.seconds)
    res.items.head.Clusters.cluster_name should be(clusterId)
  }

  "Response" should "return hosts" in {
    val uri = Uri(s"http://$host:$port/api/v1/clusters/$clusterId/hosts?fields=Hosts/host_name,Hosts/ip")
    (mockRequestDispatcher.submitRequest _).expects(HttpMethods.GET, uri, *, *, *).returns {
      Future(response(getHosts))
    }
    val future = HdpClient.getHosts(clusterId, conn)
    val res = Await.result(future, 45.seconds)
    res.items.head.Hosts.ip should be("172.24.103.157")
  }

  "Response" should "return host" in {
    val uri = Uri(s"http://$host:$port/api/v1/hosts?fields=Hosts/host_name,Hosts/ip&Hosts/cluster_name=$clusterId&Hosts/host_name=$host")
    (mockRequestDispatcher.submitRequest _).expects(HttpMethods.GET, uri, *, *, *).returns {
      Future(response(getHost))
    }
    val future = HdpClient.getHost(clusterId, host)
    val res = Await.result(future, 45.seconds)
    res.ip should be("172.24.103.157")
  }

  "Response" should "return namenode" in {
    val uri = Uri(s"http://$host:$port/api/v1/clusters/$clusterId/configurations/service_config_versions?service_name=HDFS&is_current=true")
    (mockRequestDispatcher.submitRequest _).expects(HttpMethods.GET, uri, *, *, *).returns {
      Future(response(getNameNode))
    }
    val future = HdpClient.getCurrentServiceConfiguration(clusterId, HDFS_service, isDefault = false, conn)
    val res = Await.result(future, 45.seconds)

    getPropertyValue(res, namenode_http_address).get should be("nn.com:50070")
  }

  "Response" should "return not empty services" in {
    val uri = Uri(s"http://$host:$port/api/v1/clusters/$clusterId/services/?fields=ServiceInfo/service_name")
    (mockRequestDispatcher.submitRequest _).expects(HttpMethods.GET, uri, *, *, *).returns {
      Future(response(getServices))
    }
    val future = HdpClient.getServices(clusterId, conn)
    val res = Await.result(future, 45.seconds)
    res.items should not be empty
  }

  "Response" should " throw HdpClientException" in {
    val uri = Uri(s"http://$host:$port/api/v1/clusters?fields=Clusters/cluster_id&Clusters/cluster_name")
    (mockRequestDispatcher.submitRequest _).expects(HttpMethods.GET, uri, *, *, *).returns {
      Future(response(getClustersWrong))
    }
    val future = HdpClient.getClusters(conn)
    Await.ready(future, 45.seconds).value.get shouldBe a [Failure[_]]
  }

  private def response(body: String) = Success(HttpClientResponse[Array[Byte]](StatusCodes.Accepted, body.getBytes, Seq.empty))
}
