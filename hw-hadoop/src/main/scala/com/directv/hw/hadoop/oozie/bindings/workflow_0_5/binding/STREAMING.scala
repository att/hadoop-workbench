// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_5.binding

import java.util.{ArrayList, List}
import javax.xml.bind.annotation.{XmlAccessType, XmlAccessorType, XmlElement, XmlType}

import com.google.gson.annotations.SerializedName

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "STREAMING", propOrder = Array("mapper", "reducer", "recordReader", "recordReaderMapping", "env"), namespace = "uri:oozie:workflow:0.5") class STREAMING {
  @BeanProperty var mapper: String = null
  @BeanProperty var reducer: String = null
  @XmlElement(name = "record-reader")
  @SerializedName("record-reader")
  @BeanProperty var recordReader: String = null
  @XmlElement(name = "record-reader-mapping")
  @SerializedName("record-reader-mapping")
  @BeanProperty val recordReaderMapping: List[String] = new ArrayList[String]
  @BeanProperty val env: List[String] = new ArrayList[String]

}
