// JAXB

package com.directv.hw.hadoop.oozie.bindings.hive_action_0_2.binding

import javax.xml.bind.annotation.{XmlAccessType, XmlAccessorType, XmlAttribute, XmlType}

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "DELETE", namespace = "uri:oozie:hive-action:0.2") class DELETE {
  @XmlAttribute(name = "path", required = true)
  @BeanProperty var path: String = null

}
