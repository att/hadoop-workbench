// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_4_5.binding

import javax.xml.bind.annotation.{XmlAccessType, XmlAccessorType, XmlType}

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "PIPES", propOrder = Array("map", "reduce", "inputformat", "partitioner", "writer", "program"), namespace = "uri:oozie:workflow:0.4.5") class PIPES {
  @BeanProperty var map: String = null
  @BeanProperty var reduce: String = null
  @BeanProperty var inputformat: String = null
  @BeanProperty var partitioner: String = null
  @BeanProperty var writer: String = null
  @BeanProperty var program: String = null

}
