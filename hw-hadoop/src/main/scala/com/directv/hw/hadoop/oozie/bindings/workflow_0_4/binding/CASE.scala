// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_4.binding

import javax.xml.bind.annotation.{XmlAccessType, XmlAccessorType, XmlAttribute, XmlType, XmlValue}

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "CASE", propOrder = Array("value"), namespace = "uri:oozie:workflow:0.4") class CASE {
  @XmlValue
  @BeanProperty var value: String = null
  @XmlAttribute(name = "to", required = true)
  @BeanProperty var to: String = null

}
