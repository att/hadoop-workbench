// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_2_5.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation.{XmlAccessType, XmlAccessorType, XmlAttribute, XmlElement, XmlType}

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "CREDENTIAL", propOrder = Array("property"), namespace = "uri:oozie:workflow:0.2.5") object CREDENTIAL {


  @XmlAccessorType(XmlAccessType.FIELD)
  @XmlType(name = "", propOrder = Array("name", "value", "description"), namespace = "uri:oozie:workflow:0.2.5") class Property {
    @XmlElement(required = true)
    @BeanProperty var name: String = null
    @XmlElement(required = true)
    @BeanProperty var value: String = null
    @BeanProperty var description: String = null

  }

}

@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "CREDENTIAL", propOrder = Array("property"), namespace = "uri:oozie:workflow:0.2.5") class CREDENTIAL {
  @BeanProperty val property: List[CREDENTIAL.Property] = new ArrayList[CREDENTIAL.Property]
  @XmlAttribute(name = "name", required = true)
  @BeanProperty var name: String = null
  @XmlAttribute(name = "type", required = true)
  @BeanProperty var `type`: String = null

}
