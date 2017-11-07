// JAXB

package com.directv.hw.hadoop.oozie.bindings.ssh_action_0_2.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation._

import com.google.gson.annotations.SerializedName

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "ssh", namespace = "uri:oozie:ssh-action:0.2")
@XmlType(name = "ACTION", propOrder = Array("host", "command", "args", "arg", "captureOutput"), namespace = "uri:oozie:ssh-action:0.2")
class ACTION {
  @XmlElement(required = true)
  @BeanProperty var host: String = null
  @XmlElement(required = true)
  @BeanProperty var command: String = null
  @BeanProperty val args: List[String] = new ArrayList[String]
  @BeanProperty val arg: List[String] = new ArrayList[String]
  @XmlElement(name = "capture-output")
  @SerializedName("capture-output")
  @BeanProperty var captureOutput: FLAG = null

}
