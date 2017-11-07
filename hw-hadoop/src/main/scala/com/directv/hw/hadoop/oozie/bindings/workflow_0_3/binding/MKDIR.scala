// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_3.binding

import javax.xml.bind.annotation._

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "MKDIR", namespace = "uri:oozie:workflow:0.3")
@XmlRootElement(name = "mkdir") class MKDIR {
  @XmlAttribute(name = "path", required = true)
  @BeanProperty var path: String = null

}
