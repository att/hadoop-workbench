// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_4_5.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation._


@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "switch")
@XmlType(name = "SWITCH", propOrder = Array("_case", "_default"), namespace = "uri:oozie:workflow:0.4.5") class SWITCH {
  @XmlElement(name = "case", required = true) var _case: List[CASE] = null
  @XmlElement(name = "default", required = true) var _default: DEFAULT = null


  def getCase: List[CASE] = {
    if (_case == null) {
      _case = new ArrayList[CASE]
    }
    return this._case
  }


  def getDefault: DEFAULT = {
    return _default
  }


  def setDefault(value: DEFAULT) {
    this._default = value
  }
}
