// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_3.binding

import javax.xml.bind.annotation.{XmlAccessType, XmlAccessorType, XmlAttribute, XmlElement, XmlType}

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "KILL", propOrder = Array("message"), namespace = "uri:oozie:workflow:0.3") class KILL {
  @XmlElement(required = true)
  @BeanProperty var message: String = null
  @XmlAttribute(name = "name", required = true)
  @BeanProperty var name: String = null

}
