// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_5.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation.{XmlAccessType, XmlAccessorType, XmlElement, XmlType}

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "PARAMETERS", propOrder = Array("property"), namespace = "uri:oozie:workflow:0.5") object PARAMETERS {


  @XmlAccessorType(XmlAccessType.FIELD)
  @XmlType(name = "", propOrder = Array("name", "value", "description"), namespace = "uri:oozie:workflow:0.5") class Property {
    @XmlElement(required = true)
    @BeanProperty var name: String = null
    @BeanProperty var value: String = null
    @BeanProperty var description: String = null

  }

}

@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "PARAMETERS", propOrder = Array("property"), namespace = "uri:oozie:workflow:0.5") class PARAMETERS {
  @XmlElement(required = true)
  @BeanProperty val property: List[PARAMETERS.Property] = new ArrayList[PARAMETERS.Property]

}
