// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_1.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation._

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "fs")
@XmlType(name = "FS", propOrder = Array("delete", "mkdir", "move", "chmod"), namespace = "uri:oozie:workflow:0.1")
@XmlSeeAlso(Array(classOf[DELETE], classOf[MKDIR], classOf[MOVE], classOf[CHMOD])) class FS {
  @XmlElement(name="delete")
  @BeanProperty var delete: List[DELETE] = new ArrayList[DELETE]
  @XmlElement(name="mkdir")
  @BeanProperty var mkdir: List[MKDIR] = new ArrayList[MKDIR]
  @XmlElement(name="move")
  @BeanProperty var move: List[MOVE] = new ArrayList[MOVE]
  @XmlElement(name="chmod")
  @BeanProperty var chmod: List[CHMOD] = new ArrayList[CHMOD]

}
