// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_1.binding

import javax.xml.bind.annotation._

import com.google.gson.annotations.SerializedName

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "sub-workflow")
@XmlType(name = "SUB-WORKFLOW", propOrder = Array("appPath", "propagateConfiguration", "configuration"), namespace = "uri:oozie:workflow:0.1") class SUBWORKFLOW {
  @XmlElement(name = "app-path", required = true)
  @SerializedName("app-path")
  @BeanProperty var appPath: String = null
  @XmlElement(name = "propagate-configuration")
  @SerializedName("propagate-configuration")
  @BeanProperty var propagateConfiguration: FLAG = null
  @BeanProperty var configuration: CONFIGURATION = null

}
