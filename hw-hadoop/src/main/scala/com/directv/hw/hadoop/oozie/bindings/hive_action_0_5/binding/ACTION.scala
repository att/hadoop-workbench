// JAXB

package com.directv.hw.hadoop.oozie.bindings.hive_action_0_5.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation._

import com.google.gson.annotations.SerializedName

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "hive", namespace = "uri:oozie:hive-action:0.5")
@XmlType(name = "ACTION", namespace = "uri:oozie:hive-action:0.5", propOrder = Array("jobTracker", "nameNode", "prepare", "jobXml",
  "configuration", "script", "param", "argument", "file", "archive")) class ACTION {
  @XmlElement(name = "job-tracker")
  @SerializedName("job-tracker")
  @BeanProperty var jobTracker: String = null
  @XmlElement(name = "name-node")
  @SerializedName("name-node")
  @BeanProperty var nameNode: String = null
  @BeanProperty var prepare: PREPARE = null
  @XmlElement(name = "job-xml")
  @SerializedName("job-xml")
  @BeanProperty var jobXml: List[String] = new ArrayList[String]
  @BeanProperty var configuration: CONFIGURATION = null
  @XmlElement(required = true)
  @BeanProperty var script: String = null
  @BeanProperty var param: List[String] = new ArrayList[String]
  @BeanProperty var argument: List[String] = new ArrayList[String]
  @BeanProperty var file: List[String] = new ArrayList[String]
  @BeanProperty var archive: List[String] = new ArrayList[String]

}
