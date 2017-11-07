// JAXB

package com.directv.hw.hadoop.oozie.bindings.shell_action_0_3.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation.{XmlAccessType, XmlAccessorType, XmlType}

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "PREPARE", propOrder = Array("delete", "mkdir"), namespace = "uri:oozie:shell-action:0.3") class PREPARE {
  @BeanProperty val delete: List[DELETE] = new ArrayList[DELETE]
  @BeanProperty val mkdir: List[MKDIR] = new ArrayList[MKDIR]

}
