// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_1.binding

import javax.xml.bind.annotation._

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "TOUCHZ", namespace = "uri:oozie:workflow:0.1")
@XmlRootElement(name = "touchz") class TOUCHZ {
  @XmlAttribute(name = "path", required = true)
  @BeanProperty var path: String = null

}
