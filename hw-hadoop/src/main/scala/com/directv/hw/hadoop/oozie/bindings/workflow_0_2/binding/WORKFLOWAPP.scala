// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_2.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation._

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(namespace = "uri:oozie:workflow:0.2", name = "workflow-app")
@XmlType(name = "WORKFLOW-APP", propOrder = Array("name", "start", "decisionOrForkOrJoin", "end"
//  , "any"
), namespace = "uri:oozie:workflow:0.2")
class WORKFLOWAPP {
  @XmlElement(required = true)
  @BeanProperty var start: START = null
  @XmlElements(Array(new XmlElement(name = "decision", `type` = classOf[DECISION]), new XmlElement(name = "fork", `type` = classOf[FORK]), new
      XmlElement(name = "join", `type` = classOf[JOIN]), new XmlElement(name = "kill", `type` = classOf[KILL]), new XmlElement(name = "action",
    `type` = classOf[ACTION])))
  @BeanProperty var decisionOrForkOrJoin: List[AnyRef] = new ArrayList[AnyRef]
  @XmlElement(required = true)
  @BeanProperty var end: END = null
  @XmlAttribute(name = "name", required = true)
  @BeanProperty var name: String = null

}
