// JAXB

package com.directv.hw.hadoop.oozie.bindings.email_action_0_1.binding

import javax.xml.bind.annotation._

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "email", namespace = "uri:oozie:email-action:0.1")
@XmlType(name = "ACTION", propOrder = Array("to", "cc", "subject", "body")) class ACTION {
  @XmlElement(required = true)
  @BeanProperty var to: String = null
  @BeanProperty var cc: String = null
  @XmlElement(required = true)
  @BeanProperty var subject: String = null
  @XmlElement(required = true)
  @BeanProperty var body: String = null

}
