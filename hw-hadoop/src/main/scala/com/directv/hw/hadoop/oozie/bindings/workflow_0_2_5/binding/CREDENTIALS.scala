// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_2_5.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation.{XmlAccessType, XmlAccessorType, XmlType}

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "CREDENTIALS", propOrder = Array("credential"), namespace = "uri:oozie:workflow:0.2.5") class CREDENTIALS {
  @BeanProperty val credential: List[CREDENTIAL] = new ArrayList[CREDENTIAL]

}
