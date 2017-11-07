// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_4_5.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation.{XmlAccessType, XmlAccessorType, XmlType}

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "PREPARE", propOrder = Array("delete", "mkdir"), namespace = "uri:oozie:workflow:0.4.5") class PREPARE {
  @BeanProperty val delete: List[DELETE] = new ArrayList[DELETE]
  @BeanProperty val mkdir: List[MKDIR] = new ArrayList[MKDIR]

}
