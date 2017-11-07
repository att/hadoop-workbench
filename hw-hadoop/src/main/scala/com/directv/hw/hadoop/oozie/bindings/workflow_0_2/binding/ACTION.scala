// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_2.binding

import javax.xml.bind.annotation._

import com.directv.hw.hadoop.oozie.bindings.JsonExclude
import com.google.gson.annotations.SerializedName

import scala.beans.BeanProperty


@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "action", namespace = "uri:oozie:workflow:0.2")
@XmlType(name = "ACTION", propOrder = Array("name",
  "mapReduce", "pig", "subWorkflow", "fs", "java",
  "sqoop_0_4", "sqoop_0_3", "sqoop_0_2",
  "ssh_0_2", "ssh_0_1",
  "shell_0_3", "shell_0_2", "shell_0_1", "spark_0_1",
  "hive_0_5", "hive_0_4", "hive_0_3", "hive_0_2",
  "email_0_2", "email_0_1",
  "distcp_0_2", "distcp_0_1",
  "ok", "error"
)
  , namespace = "uri:oozie:workflow:0.2") class ACTION {
  @XmlElement(name = "map-reduce")
  @SerializedName("map-reduce")
  @BeanProperty var mapReduce: MAPREDUCE = null
  @XmlTransient
  @SerializedName("map-reduce2")
  @BeanProperty var mapReduce2: MAPREDUCE = null
  @BeanProperty var pig: PIG = null
  @XmlElement(name = "sub-workflow")
  @SerializedName("sub-workflow")
  @BeanProperty var subWorkflow: SUBWORKFLOW = null
  @BeanProperty var fs: FS = null
  @BeanProperty var java: JAVA = null

  // sqoop
  @XmlElement(name = "sqoop", namespace = "uri:oozie:sqoop-action:0.4")
  @BeanProperty var sqoop_0_4: com.directv.hw.hadoop.oozie.bindings.sqoop_action_0_4.binding.ACTION = null
  @XmlElement(name = "sqoop", namespace = "uri:oozie:sqoop-action:0.3")
  @BeanProperty var sqoop_0_3: com.directv.hw.hadoop.oozie.bindings.sqoop_action_0_3.binding.ACTION = null
  @XmlElement(name = "sqoop", namespace = "uri:oozie:sqoop-action:0.2")
  @BeanProperty var sqoop_0_2: com.directv.hw.hadoop.oozie.bindings.sqoop_action_0_2.binding.ACTION = null
  // ssh
  @XmlElement(name = "ssh", namespace = "uri:oozie:ssh-action:0.2")
  @BeanProperty var ssh_0_2: com.directv.hw.hadoop.oozie.bindings.ssh_action_0_2.binding.ACTION = null
  @XmlElement(name = "ssh", namespace = "uri:oozie:ssh-action:0.1")
  @BeanProperty var ssh_0_1: com.directv.hw.hadoop.oozie.bindings.ssh_action_0_1.binding.ACTION = null
  // shell
  @XmlElement(name = "shell", namespace = "uri:oozie:shell-action:0.3")
  @BeanProperty var shell_0_3: com.directv.hw.hadoop.oozie.bindings.shell_action_0_3.binding.ACTION = null
  @XmlElement(name = "shell", namespace = "uri:oozie:shell-action:0.2")
  @BeanProperty var shell_0_2: com.directv.hw.hadoop.oozie.bindings.shell_action_0_2.binding.ACTION = null
  @XmlElement(name = "shell", namespace = "uri:oozie:shell-action:0.1")
  @BeanProperty var shell_0_1: com.directv.hw.hadoop.oozie.bindings.shell_action_0_1.binding.ACTION = null
  // spark
  @XmlElement(name = "spark", namespace = "uri:oozie:spark-action:0.1")
  @BeanProperty var spark_0_1: com.directv.hw.hadoop.oozie.bindings.spark_action_0_1.binding.ACTION = null
  // hive
  @XmlElement(name = "hive", namespace = "uri:oozie:hive-action:0.5")
  @BeanProperty var hive_0_5: com.directv.hw.hadoop.oozie.bindings.hive_action_0_5.binding.ACTION = null
  @XmlElement(name = "hive", namespace = "uri:oozie:hive-action:0.4")
  @BeanProperty var hive_0_4: com.directv.hw.hadoop.oozie.bindings.hive_action_0_4.binding.ACTION = null
  @XmlElement(name = "hive", namespace = "uri:oozie:hive-action:0.3")
  @BeanProperty var hive_0_3: com.directv.hw.hadoop.oozie.bindings.hive_action_0_3.binding.ACTION = null
  @XmlElement(name = "hive", namespace = "uri:oozie:hive-action:0.2")
  @BeanProperty var hive_0_2: com.directv.hw.hadoop.oozie.bindings.hive_action_0_2.binding.ACTION = null
  //email
  @XmlElement(name = "email", namespace = "uri:oozie:email-action:0.2")
  @BeanProperty var email_0_2: com.directv.hw.hadoop.oozie.bindings.email_action_0_2.binding.ACTION = null
  @XmlElement(name = "email", namespace = "uri:oozie:email-action:0.1")
  @BeanProperty var email_0_1: com.directv.hw.hadoop.oozie.bindings.email_action_0_1.binding.ACTION = null
  //distcp
  @XmlElement(name = "distcp", namespace = "uri:oozie:distcp-action:0.2")
  @BeanProperty var distcp_0_2: com.directv.hw.hadoop.oozie.bindings.distcp_action_0_2.binding.ACTION = null
  @XmlElement(name = "distcp", namespace = "uri:oozie:distcp-action:0.1")
  @BeanProperty var distcp_0_1: com.directv.hw.hadoop.oozie.bindings.distcp_action_0_1.binding.ACTION = null

  @JsonExclude
  @BeanProperty var ok: ACTIONTRANSITION = null
  @XmlElement(required = true)
  @JsonExclude
  @BeanProperty var error: ACTIONTRANSITION = null

  @XmlAttribute(name = "name", required = true)
  @BeanProperty var name: String = null

}
