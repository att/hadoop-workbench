// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_4.binding

import javax.xml.bind.annotation.{XmlAccessType, XmlAccessorType, XmlAttribute, XmlType}

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "ACTION_TRANSITION", namespace = "uri:oozie:workflow:0.4") class ACTIONTRANSITION {
  @XmlAttribute(name = "to", required = true)
  @BeanProperty var to: String = null

}
