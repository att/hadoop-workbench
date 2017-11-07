// JAXB

package com.directv.hw.hadoop.oozie.bindings.sqoop_action_0_4.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation.{XmlAccessType, XmlAccessorType, XmlType}

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "PREPARE", propOrder = Array("delete", "mkdir"), namespace = "uri:oozie:sqoop-action:0.4") class PREPARE {
  @BeanProperty val delete: List[DELETE] = new ArrayList[DELETE]
  @BeanProperty val mkdir: List[MKDIR] = new ArrayList[MKDIR]

}
