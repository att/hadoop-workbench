package com.directv.hw.hadoop.cloudera.service

import java.io.InputStream
import javax.ws.rs.WebApplicationException

import com.cloudera.api.model._
import com.cloudera.api.v2.RolesResourceV2
import com.cloudera.api.v3.{RoleCommandsResourceV3, ServicesResourceV3}
import com.cloudera.api.{ClouderaManagerClientBuilder, DataView}
import resource._

import scala.collection.JavaConverters._

/**
 * This class is for manual testing only. Doesn't belong to actual code base
 */
object ClouderaExample extends App {

  testFlume()

  def testKafka() = {
    val root = getClouderaService

    val clusterId = root.getClustersResource.readClusters(DataView.SUMMARY).getClusters.asScala.head.getName

    val servicesResource = root.getClustersResource.getServicesResource(clusterId)

    val services = servicesResource.readServices(DataView.SUMMARY).getServices.asScala
    services foreach (s => p(s.getName + " " + s.getDisplayName + " " + s.getType))

    val serviceId = "kafka"

    val roleConfigGroupsResource = servicesResource.getRoleConfigGroupsResource(serviceId)
    val rolesResource = servicesResource.getRolesResource(serviceId)

    val groups = roleConfigGroupsResource.readRoleConfigGroups().getGroups.asScala
    p("groups", groups.size)
    val roles = rolesResource.readRoles().getRoles.asScala
    groups foreach { item =>
      p("displayName", item.getDisplayName)
      p("name", item.getName)
//      p(item.getRoleConfigGroupRef)
      Option(item.getConfig) foreach { config =>
        val configs = Option(config.getConfigs) map (_.asScala) getOrElse List.empty
        p("configs", configs.size)
        configs foreach { c =>
          p(c.getName, c.getDisplayName, c.getValue)
        }
      }
    }

//    val reolse =
  }

  def testFlume() = {
    val flumeServiceId = "flume"

    val root = getClouderaService
    val clusterId = root.getClustersResource.readClusters(DataView.FULL).getClusters.asScala.head.getName
    //    val hostRefs = root.getClustersResource.listHosts(clusterId).asScala
    val hosts = root.getHostsResource.readHosts(DataView.SUMMARY).asScala
        hosts.foreach(h => p(s"${h.getHostId} ${h.getHostname}"))
    val hosts2 = root.getClustersResource.listHosts(clusterId).asScala
//    hosts2.foreach(p)
    //    hosts2.foreach(h => p(s"${h.getHostId})
    val servicesResource: ServicesResourceV3 = root.getClustersResource.getServicesResource(clusterId)
    servicesResource.readServices(DataView.FULL).getServices.asScala.foreach(s => p(s.getName + " " + s.getDisplayName + " " + s.getType))
    val roleConfigGroupsResource = servicesResource.getRoleConfigGroupsResource(flumeServiceId)

    val name = "flume-agent-1442442582998"
    val item1 = new ApiConfig("agent_config_file", "a.b = c")
    val apiConfigList = new ApiConfigList(List(item1).asJava)
    roleConfigGroupsResource.updateConfig(name, "", apiConfigList)



    val groups = roleConfigGroupsResource.readRoleConfigGroups().asScala
    groups.foreach { group =>
            p("Group",group.getName, group.getDisplayName)
//            val roles = roleConfigGroupsResource.readRoles(group.getName).asScala
//            roles.foreach { role =>
//              p(role.getHostRef)
//            }
    }
//    System.exit(0)

//    val group = groups.find(_.getDisplayName == "Z5").get
//    val group = groups.find(_.getDisplayName == "Flume001").get
    val group = groups.find(_.getName == name).get

    Option(group.getConfig) foreach { config =>
      val configs = Option(config.getConfigs) map (_.asScala) getOrElse List.empty
      p("configs", configs.size)
      configs foreach { c =>
        p(c.getName, c.getValue)
      }
    }

    System.exit(0)


    val rolesResource: RolesResourceV2 = servicesResource.getRolesResource(flumeServiceId)
    val roles = roleConfigGroupsResource.readRoles(group.getName)
    val roles2 = rolesResource.readRoles().getRoles.asScala
//    roles.foreach(role => p(role.getType + " " + role.getName))

    val host1 = hosts.find(_.getHostname.contains("cloudera1")).get
    val host2 = hosts.find(_.getHostname.contains("cloudera2")).get
    val host3 = hosts.find(_.getHostname.contains("cloudera3")).get
    val host4 = hosts.find(_.getHostname.contains("cloudera4")).get

    val commandsResource: RoleCommandsResourceV3 = servicesResource.getRoleCommandsResource(flumeServiceId)
    try {
//      createRoles(rolesResource, group, List(host1, host2, host3))
      startRoles(rolesResource, commandsResource, group, List(host1))

//      deleteRoles(rolesResource, group, List(host1, host2, host3))
    } catch {
      case e: WebApplicationException =>
        val response = e.getResponse
        val entity = response.getEntity
        entity match {
          case is: InputStream =>
            managed(is).map { is: InputStream =>
              p(scala.io.Source.fromInputStream(is).getLines().mkString("\n"))
            }
        }
    }

  }

  private def createRoles(rolesResource: RolesResourceV2, group: ApiRoleConfigGroup, hosts: List[ApiHost]) = {
    hosts.foreach { host =>
      val role = new ApiRole()
      val hostRef = new ApiHostRef(host.getHostId)
      role.setHostRef(hostRef)
      val groupRef = new ApiRoleConfigGroupRef(group.getName)
      role.setRoleConfigGroupRef(groupRef)
      val name = s"flume${System.currentTimeMillis()}"
      role.setName(name)
      role.setType("AGENT")
      val roleList = new ApiRoleList(List(role).asJava)
      rolesResource.createRoles(roleList)
    }
  }

  private def deleteRoles(rolesResource: RolesResourceV2, group: ApiRoleConfigGroup, hosts: List[ApiHost]) = {
    rolesResource.readRoles().getRoles.asScala
      .filter { role =>
      hosts.exists(_.getHostId == role.getHostRef.getHostId) &&
        role.getRoleConfigGroupRef.getRoleConfigGroupName == group.getName
      }.foreach { role =>
        rolesResource.deleteRole(role.getName)
      }
  }

  private def startRoles(rolesResource: RolesResourceV2, commandsResource: RoleCommandsResourceV3, group: ApiRoleConfigGroup, hosts: List[ApiHost]) = {
    rolesResource.readRoles().getRoles.asScala
      .filter { role =>
      hosts.exists(_.getHostId == role.getHostRef.getHostId) &&
        role.getRoleConfigGroupRef.getRoleConfigGroupName == group.getName
      }.headOption.foreach { role =>
        val list = List(role.getName).asJava
        val result = commandsResource.startCommand(new ApiRoleNameList(list))
        result.getErrors.asScala.foreach(e => p(s"error: e"))
        result.getCommands.asScala.filterNot(_.getSuccess).foreach(c => p(s"message: ${c.getResultMessage}"))
      }
  }

  def p(s: Any) = {
    val string = s match {
      case Iterable => s.asInstanceOf[Iterable[_]] map (_.toString) mkString "  "
      case _ => s
    }
    System.out.println("__--__   " + string)
  }

  def getClouderaService = {
    val host = "dap02"
    val port = 7180
    val user = "admin"
    val pass = "admin"
    val root = new ClouderaManagerClientBuilder()
      .withHost(host)
      .withUsernamePassword(user, pass)
      .withPort(port)
      .enableLogging()
      .build()
    root.getRootV3
  }
}

sealed trait InstanceCommand
case object Start extends InstanceCommand
case object Stop extends InstanceCommand
case object Restart extends InstanceCommand
