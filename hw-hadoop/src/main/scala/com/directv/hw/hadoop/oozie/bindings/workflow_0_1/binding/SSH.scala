// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_1.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation._

import com.google.gson.annotations.SerializedName

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "ssh")
@XmlType(name = "SSH", propOrder = Array("host", "command", "args", "captureOutput"), namespace = "uri:oozie:workflow:0.1") class SSH {
  @XmlElement(name = "host", required = true)
  var host: String = null
  @XmlElement(name = "command", required = true)
  var command: String = null
  @XmlElement(name = "args", required = true)
  val args: List[String] = new ArrayList[String]
  @XmlElement(name = "capture-output")
  @SerializedName("capture-output")
  @BeanProperty var captureOutput: FLAG = null

}
