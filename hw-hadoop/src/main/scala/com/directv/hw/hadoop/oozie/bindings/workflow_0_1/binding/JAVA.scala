// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_1.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation._

import com.google.gson.annotations.SerializedName

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "java")
@XmlType(name = "JAVA", propOrder = Array("jobTracker", "nameNode", "prepare", "jobXml", "configuration", "mainClass", "javaOpts",
  "arg", "file", "archive", "captureOutput"), namespace = "uri:oozie:workflow:0.1") class JAVA {
  @XmlElement(name = "job-tracker")
  @SerializedName("job-tracker")
  @BeanProperty var jobTracker: String = null
  @XmlElement(name = "name-node")
  @SerializedName("name-node")
  @BeanProperty var nameNode: String = null
  @BeanProperty var prepare: PREPARE = null
  @XmlElement(name = "job-xml")
  @SerializedName("job-xml")
  @BeanProperty var jobXml: String = null
  @BeanProperty var configuration: CONFIGURATION = null
  @XmlElement(name = "main-class", required = true)
  @SerializedName("main-class")
  @BeanProperty var mainClass: String = null
  @XmlElement(name = "java-opts")
  @SerializedName("java-opts")
  @BeanProperty var javaOpts: String = null
  @BeanProperty val arg: List[String] = new ArrayList[String]
  @BeanProperty val file: List[String] = new ArrayList[String]
  @BeanProperty val archive: List[String] = new ArrayList[String]
  @XmlElement(name = "capture-output")
  @SerializedName("capture-output")
  @BeanProperty var captureOutput: FLAG = null

}
