// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_2.binding

import javax.xml.bind.annotation.{XmlAccessType, XmlAccessorType, XmlAttribute, XmlType}

import com.directv.hw.hadoop.oozie.bindings.JsonExclude

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "START", namespace = "uri:oozie:workflow:0.2") class START {
  @XmlAttribute(name = "to", required = true)
  @JsonExclude
  @BeanProperty var to: String = null

}
