// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_2_5.binding

import javax.xml.bind.annotation._

import com.directv.hw.hadoop.oozie.bindings.JsonExclude

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "decision")
@XmlType(name = "DECISION", propOrder = Array("_switch"), namespace = "uri:oozie:workflow:0.2.5") class DECISION {
  @XmlElement(name = "switch", required = true)
  @JsonExclude var _switch: SWITCH = null
  @XmlAttribute(name = "name", required = true)
  @BeanProperty var name: String = null

  def getSwitch: SWITCH =  _switch

  def setSwitch(value: SWITCH) {
    this._switch = value
  }

}
