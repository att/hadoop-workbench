// JAXB

package com.directv.hw.hadoop.oozie.bindings.shell_action_0_3.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation._

import com.google.gson.annotations.SerializedName

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "shell", namespace = "uri:oozie:shell-action:0.3")
@XmlType(name = "ACTION", propOrder = Array("jobTracker", "nameNode", "prepare", "jobXml", "configuration", "exec", "argument", "envVar", "file",
  "archive", "captureOutput"), namespace = "uri:oozie:shell-action:0.3") class ACTION {
  @XmlElement(name = "job-tracker")
  @SerializedName("job-tracker")
  @BeanProperty var jobTracker: String = null
  @XmlElement(name = "name-node")
  @SerializedName("name-node")
  @BeanProperty var nameNode: String = null
  @BeanProperty var prepare: PREPARE = null
  @XmlElement(name = "job-xml")
  @SerializedName("job-xml")
  @BeanProperty val jobXml: List[String] = new ArrayList[String]
  @BeanProperty var configuration: CONFIGURATION = null
  @XmlElement(required = true)
  @BeanProperty var exec: String = null
  @BeanProperty val argument: List[String] = new ArrayList[String]
  @XmlElement(name = "env-var")
  @SerializedName("env-var")
  @BeanProperty val envVar: List[String] = new ArrayList[String]
  @BeanProperty val file: List[String] = new ArrayList[String]
  @BeanProperty val archive: List[String] = new ArrayList[String]
  @XmlElement(name = "capture-output")
  @SerializedName("capture-output")
  @BeanProperty var captureOutput: FLAG = null

}
