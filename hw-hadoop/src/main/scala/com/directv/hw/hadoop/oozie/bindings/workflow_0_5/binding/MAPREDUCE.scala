// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_5.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation._

//import com.directv.hw.web.ingest.oozie.model.workflow_0_5.binding.PIPES
import com.google.gson.annotations.SerializedName

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "map-reduce")
@XmlType(name = "MAP-REDUCE", propOrder = Array("jobTracker", "nameNode", "prepare", "streaming", "pipes", "jobXml", "configuration", "file",
  "archive"), namespace = "uri:oozie:workflow:0.5") class MAPREDUCE {
  @XmlElement(name = "job-tracker")
  @SerializedName("job-tracker")
  @BeanProperty var jobTracker: String = null
  @XmlElement(name = "name-node")
  @SerializedName("name-node")
  @BeanProperty var nameNode: String = null
  @BeanProperty var prepare: PREPARE = null
  @BeanProperty var streaming: STREAMING = null
  @BeanProperty var pipes: PIPES = null
  @XmlElement(name = "job-xml")
  @SerializedName("job-xml")
  @BeanProperty val jobXml: List[String] = new ArrayList[String]
  @BeanProperty var configuration: CONFIGURATION = null
  @BeanProperty val file: List[String] = new ArrayList[String]
  @BeanProperty val archive: List[String] = new ArrayList[String]

}
