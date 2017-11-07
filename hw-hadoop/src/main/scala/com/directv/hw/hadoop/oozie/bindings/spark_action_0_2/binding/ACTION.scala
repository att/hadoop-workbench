// JAXB

package com.directv.hw.hadoop.oozie.bindings.spark_action_0_2.binding

import java.util
import java.util.{ArrayList, List}
import javax.xml.bind.annotation._

import com.google.gson.annotations.SerializedName

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "spark", namespace = "uri:oozie:spark-action:0.2")
@XmlType(name = "ACTION", propOrder = Array("jobTracker", "nameNode", "prepare", "jobXml", "configuration", "master", "mode", "name", "_class",
  "jar", "sparkOpts", "arg", "file", "archive"), namespace = "uri:oozie:spark-action:0.2") class ACTION {
  @XmlElement(name = "job-tracker", required = true)
  @SerializedName("job-tracker")
  @BeanProperty var jobTracker: String = _
  @XmlElement(name = "name-node", required = true)
  @SerializedName("name-node")
  @BeanProperty var nameNode: String = _
  @BeanProperty var prepare: PREPARE = _
  @XmlElement(name = "job-xml")
  @SerializedName("job-xml")
  @BeanProperty var jobXml: util.List[String] = new util.ArrayList[String]
  @BeanProperty var configuration: CONFIGURATION = _
  @XmlElement(required = true)
  @BeanProperty var master: String = _
  @XmlElement
  @BeanProperty var mode: String = _
  @XmlElement(required = true)
  @BeanProperty var name: String = _
  @XmlElement(name = "class")
  @SerializedName("class")
  var _class: String = _
  @XmlElement(required = true)
  @BeanProperty var jar: String = _
  @XmlElement(name = "spark-opts")
  @SerializedName("spark-opts")
  @BeanProperty var sparkOpts: String = _
  @XmlElement
  @BeanProperty var arg: util.List[String] = new util.ArrayList[String]
  @XmlElement(required = true)
  @BeanProperty var file: util.List[String] = new util.ArrayList[String]
  @XmlElement(required = true)
  @BeanProperty var archive: util.List[String] = new util.ArrayList[String]
}
