// JAXB

package com.directv.hw.hadoop.oozie.bindings.sqoop_action_0_3.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation._

import com.google.gson.annotations.SerializedName

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "sqoop", namespace = "uri:oozie:sqoop-action:0.3")
@XmlType(name = "ACTION", propOrder = Array("jobTracker", "nameNode", "prepare", "jobXml", "configuration", "command", "arg", "file", "archive")
  , namespace = "uri:oozie:sqoop-action:0.3")
class ACTION {
  @XmlElement(name = "job-tracker", required = true)
  @SerializedName("job-tracker")
  @BeanProperty var jobTracker: String = null
  @XmlElement(name = "name-node", required = true)
  @SerializedName("name-node")
  @BeanProperty var nameNode: String = null
  @BeanProperty var prepare: PREPARE = null
  @XmlElement(name = "job-xml")
  @SerializedName("job-xml")
  @BeanProperty val jobXml: List[String] = new ArrayList[String]
  @BeanProperty var configuration: CONFIGURATION = null
  @BeanProperty var command: String = null
  @BeanProperty val arg: List[String] = new ArrayList[String]
  @BeanProperty val file: List[String] = new ArrayList[String]
  @BeanProperty val archive: List[String] = new ArrayList[String]

}
