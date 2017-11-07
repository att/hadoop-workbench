// JAXB

package com.directv.hw.hadoop.oozie.bindings.distcp_action_0_2.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation.{XmlAccessType, XmlAccessorType, XmlElement, XmlType}

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "CONFIGURATION", propOrder = Array("property")) object CONFIGURATION {


  @XmlAccessorType(XmlAccessType.FIELD)
  @XmlType(name = "", propOrder = Array("name", "value", "description")) class Property {
    @XmlElement(required = true) @BeanProperty var name: String = null
    @XmlElement(required = true) @BeanProperty var value: String = null
    @BeanProperty var description: String = null

  }

}

@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "CONFIGURATION", propOrder = Array("property")) class CONFIGURATION {
  @XmlElement(required = true) @BeanProperty var property: List[CONFIGURATION.Property] = new ArrayList[CONFIGURATION.Property]

}
