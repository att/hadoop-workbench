// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_4.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation.{XmlAccessType, XmlAccessorType, XmlElement, XmlType}

import com.google.gson.annotations.SerializedName

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "GLOBAL", propOrder = Array("jobTracker", "nameNode", "jobXml", "configuration"), namespace = "uri:oozie:workflow:0.4") class GLOBAL {
  @XmlElement(name = "job-tracker")
  @SerializedName("job-tracker")
  @BeanProperty var jobTracker: String = null
  @XmlElement(name = "name-node")
  @SerializedName("name-node")
  @BeanProperty var nameNode: String = null
  @SerializedName("job-xml")
  @XmlElement(name = "job-xml")
  @BeanProperty val jobXml: List[String] = new ArrayList[String]
  @BeanProperty var configuration: CONFIGURATION = null

}
