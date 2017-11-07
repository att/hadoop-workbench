// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_5.binding

import javax.xml.bind.annotation.{XmlAccessType, XmlAccessorType, XmlAttribute, XmlType}

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "DEFAULT", namespace = "uri:oozie:workflow:0.5") class DEFAULT {
  @XmlAttribute(name = "to", required = true)
  @BeanProperty var to: String = null

}
