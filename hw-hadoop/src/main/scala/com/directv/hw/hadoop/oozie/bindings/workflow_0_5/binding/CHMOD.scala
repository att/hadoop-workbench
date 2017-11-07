// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_5.binding

import javax.xml.bind.annotation._
//import com.directv.hw.web.ingest.oozie.model.workflow_0_5.binding.FLAG
import com.google.gson.annotations.SerializedName

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "CHMOD", propOrder = Array("recursive"), namespace = "uri:oozie:workflow:0.5")
@XmlRootElement(name = "chmod") class CHMOD {
  @BeanProperty var recursive: FLAG = null
  @XmlAttribute(name = "path", required = true)
  @BeanProperty var path: String = null
  @XmlAttribute(name = "permissions", required = true)
  @BeanProperty var permissions: String = null
  @XmlAttribute(name = "dir-files")
  @SerializedName("dir-files")
  @BeanProperty var dirFiles: String = null

}
