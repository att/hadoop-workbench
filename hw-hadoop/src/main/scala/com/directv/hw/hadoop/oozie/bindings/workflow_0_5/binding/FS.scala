// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_5.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation._
//import com.directv.hw.web.ingest.oozie.model.workflow_0_5.binding.TOUCHZ
import com.google.gson.annotations.SerializedName

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "fs")
@XmlType(name = "FS", propOrder = Array("nameNode", "jobXml", "configuration", "deleteOrMkdirOrMove"), namespace = "uri:oozie:workflow:0.5")
@XmlSeeAlso(Array(classOf[DELETE], classOf[MKDIR], classOf[MOVE], classOf[CHMOD], classOf[TOUCHZ], classOf[CHGRP])) class FS {
  @XmlElement(name = "name-node")
  @SerializedName("name-node")
  @BeanProperty var nameNode: String = null
  @XmlElement(name = "job-xml")
  @SerializedName("job-xml")
  @BeanProperty val jobXml: List[String] = new ArrayList[String]
  @BeanProperty var configuration: CONFIGURATION = null
  @XmlElements(Array(new XmlElement(name = "delete", `type` = classOf[DELETE]), new XmlElement(name = "mkdir", `type` = classOf[MKDIR]), new
      XmlElement(name = "move", `type` = classOf[MOVE]), new XmlElement(name = "chmod", `type` = classOf[CHMOD]), new XmlElement(name = "touchz",
    `type` = classOf[TOUCHZ]), new XmlElement(name = "chgrp", `type` = classOf[CHGRP])))
  @BeanProperty var deleteOrMkdirOrMove: List[AnyRef] = new ArrayList[AnyRef]

}
