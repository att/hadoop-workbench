// JAXB

package com.directv.hw.hadoop.oozie.bindings.distcp_action_0_2.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation._

import com.google.gson.annotations.SerializedName

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "distcp", namespace = "uri:oozie:distcp-action:0.2")
@XmlType(name = "ACTION", propOrder = Array("jobTracker", "nameNode", "prepare", "configuration", "javaOpts", "arg"), namespace = "uri:oozie:distcp-action:0.2") class ACTION {
  @XmlElement(name = "job-tracker")
  @SerializedName("job-tracker")
  @BeanProperty var jobTracker: String = null
  @XmlElement(name = "name-node")
  @SerializedName("name-node")
  @BeanProperty var nameNode: String = null
  @BeanProperty var prepare: PREPARE = null
  @BeanProperty var configuration: CONFIGURATION = null
  @XmlElement(name = "java-opts")
  @SerializedName("java-opts") @BeanProperty var javaOpts: String = null
  @BeanProperty val arg: List[String] = new ArrayList[String]

}
