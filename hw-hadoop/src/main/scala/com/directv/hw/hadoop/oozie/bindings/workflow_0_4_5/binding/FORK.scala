// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_4_5.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation._

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "fork")
@XmlType(name = "FORK", propOrder = Array("path"), namespace = "uri:oozie:workflow:0.4.5") class FORK {
  @XmlElement(required = true)
  @BeanProperty val path: List[FORKTRANSITION] = new ArrayList[FORKTRANSITION]
  @XmlAttribute(name = "name", required = true)
  @BeanProperty var name: String = null

}
