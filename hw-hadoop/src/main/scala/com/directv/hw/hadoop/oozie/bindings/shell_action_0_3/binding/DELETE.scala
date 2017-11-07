// JAXB

package com.directv.hw.hadoop.oozie.bindings.shell_action_0_3.binding

import javax.xml.bind.annotation.{XmlAccessType, XmlAccessorType, XmlAttribute, XmlType}

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "DELETE", namespace = "uri:oozie:shell-action:0.3") class DELETE {
  @XmlAttribute(name = "path", required = true)
  @BeanProperty var path: String = null

}
