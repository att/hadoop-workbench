// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_3.binding

import javax.xml.bind.annotation._
//import com.directv.hw.web.ingest.oozie.model.workflow_0_3.binding.FLAG
import com.google.gson.annotations.SerializedName

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "CHMOD", namespace = "uri:oozie:workflow:0.3")
@XmlRootElement(name = "chmod") class CHMOD {
  @XmlAttribute(name = "path", required = true)
  @BeanProperty var path: String = null
  @XmlAttribute(name = "permissions", required = true)
  @BeanProperty var permissions: String = null
  @XmlAttribute(name = "dir-files")
  @SerializedName("dir-files")
  @BeanProperty var dirFiles: String = null

}
