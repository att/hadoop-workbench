// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_3.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation._

//import com.directv.hw.web.ingest.oozie.model.workflow_0_3.binding.PIPES
import com.google.gson.annotations.SerializedName

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "map-reduce")
@XmlType(name = "MAP-REDUCE", propOrder = Array("jobTracker", "nameNode", "prepare", "streaming", "pipes", "jobXml", "configuration", "file",
  "archive"), namespace = "uri:oozie:workflow:0.3") class MAPREDUCE {
  @XmlElement(name = "job-tracker", required = true)
  @SerializedName("job-tracker")
  @BeanProperty var jobTracker: String = null
  @XmlElement(name = "name-node", required = true)
  @SerializedName("name-node")
  @BeanProperty var nameNode: String = null
  @BeanProperty var prepare: PREPARE = null
  @BeanProperty var streaming: STREAMING = null
  @BeanProperty var pipes: PIPES = null
  @XmlElement(name = "job-xml")
  @SerializedName("job-xml")
  @BeanProperty var jobXml: String = null
  @BeanProperty var configuration: CONFIGURATION = null
  @BeanProperty val file: List[String] = new ArrayList[String]
  @BeanProperty val archive: List[String] = new ArrayList[String]

}
