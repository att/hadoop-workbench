// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_4_5.binding

import javax.xml.bind.annotation._
//import com.directv.hw.web.ingest.oozie.model.workflow_0_4_5.binding.FLAG
import com.google.gson.annotations.SerializedName

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "CHGRP", propOrder = Array("recursive", "path", "group", "dirFiles"), namespace = "uri:oozie:workflow:0.4.5")
@XmlRootElement(name = "chgrp") class CHGRP {
  @BeanProperty var recursive: FLAG = null
  @XmlAttribute(name = "path", required = true)
  @BeanProperty var path: String = null
  @XmlAttribute(name = "group", required = true)
  @BeanProperty var group: String = null
  @XmlAttribute(name = "dir-files")
  @SerializedName("dir-files")
  @BeanProperty var dirFiles: String = null

}
