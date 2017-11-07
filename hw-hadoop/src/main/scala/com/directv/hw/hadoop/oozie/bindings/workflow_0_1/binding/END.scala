// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_1.binding

import javax.xml.bind.annotation.{XmlAccessType, XmlAccessorType, XmlAttribute, XmlType}

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "END", namespace = "uri:oozie:workflow:0.1") class END {
  @XmlAttribute(name = "name", required = true)
  @BeanProperty var name: String = null

}
