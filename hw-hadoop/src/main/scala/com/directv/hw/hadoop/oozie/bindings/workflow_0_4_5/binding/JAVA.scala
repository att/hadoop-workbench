// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_4_5.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation._
//import com.directv.hw.web.ingest.oozie.model.workflow_0_4_5.binding.PREPARE
import com.google.gson.annotations.SerializedName

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "java")
@XmlType(name = "JAVA", propOrder = Array("jobTracker", "nameNode", "prepare", "jobXml", "configuration", "mainClass", "javaOpts", "javaOpt",
  "arg", "file", "archive", "captureOutput"), namespace = "uri:oozie:workflow:0.4.5") class JAVA {
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
  @XmlElement(name = "main-class", required = true)
  @SerializedName("main-class")
  @BeanProperty var mainClass: String = null
  @XmlElement(name = "java-opts")
  @SerializedName("java-opts")
  @BeanProperty var javaOpts: String = null
  @XmlElement(name = "java-opt")
  @SerializedName("java-opt")
  @BeanProperty val javaOpt: List[String] = new ArrayList[String]
  @BeanProperty val arg: List[String] = new ArrayList[String]
  @BeanProperty val file: List[String] = new ArrayList[String]
  @BeanProperty val archive: List[String] = new ArrayList[String]
  @XmlElement(name = "capture-output")
  @SerializedName("capture-output")
  @BeanProperty var captureOutput: FLAG = null

}
