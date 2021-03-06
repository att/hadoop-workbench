// JAXB

package com.directv.hw.hadoop.oozie.bindings.sqoop_action_0_3.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation.{XmlAccessType, XmlAccessorType, XmlElement, XmlType}

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "CONFIGURATION", propOrder = Array("property"), namespace = "uri:oozie:sqoop-action:0.3") object CONFIGURATION {


  @XmlAccessorType(XmlAccessType.FIELD)
  @XmlType(name = "", propOrder = Array("name", "value", "description"), namespace = "uri:oozie:sqoop-action:0.3") class Property {
    @XmlElement(required = true)
    @BeanProperty var name: String = null
    @XmlElement(required = true)
    @BeanProperty var value: String = null
    @BeanProperty var description: String = null
  }

}

@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "CONFIGURATION", propOrder = Array("property"), namespace = "uri:oozie:sqoop-action:0.3") class CONFIGURATION {
  @XmlElement(required = true)
  @BeanProperty val property: List[CONFIGURATION.Property] = new ArrayList[CONFIGURATION.Property]

}
