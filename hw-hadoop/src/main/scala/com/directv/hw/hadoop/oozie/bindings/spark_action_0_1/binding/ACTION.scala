// JAXB

package com.directv.hw.hadoop.oozie.bindings.spark_action_0_1.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation._

import com.google.gson.annotations.SerializedName

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "spark", namespace = "uri:oozie:spark-action:0.1")
@XmlType(name = "ACTION", propOrder = Array("jobTracker", "nameNode", "prepare", "jobXml", "configuration", "master", "mode", "name", "_class",
  "jar", "sparkOpts", "arg"), namespace = "uri:oozie:spark-action:0.1") class ACTION {
  @XmlElement(name = "job-tracker", required = true)
  @SerializedName("job-tracker")
  @BeanProperty var jobTracker: String = null
  @XmlElement(name = "name-node", required = true)
  @SerializedName("name-node")
  @BeanProperty var nameNode: String = null
  @BeanProperty var prepare: PREPARE = null
  @XmlElement(name = "job-xml")
  @SerializedName("job-xml")
  @BeanProperty var jobXml: List[String] = new ArrayList[String]
  @BeanProperty var configuration: CONFIGURATION = null
  @XmlElement(required = true)
  @BeanProperty var master: String = null
  @XmlElement
  @BeanProperty var mode: String = null
  @XmlElement(required = true)
  @BeanProperty var name: String = null
  @XmlElement(name = "class")
  @SerializedName("class")
  var _class: String = null
  @XmlElement(required = true)
  @BeanProperty var jar: String = null
  @XmlElement(name = "spark-opts")
  @SerializedName("spark-opts")
  @BeanProperty var sparkOpts: String = null
  @XmlElement
  @BeanProperty var arg: List[String] = new ArrayList[String]
}
