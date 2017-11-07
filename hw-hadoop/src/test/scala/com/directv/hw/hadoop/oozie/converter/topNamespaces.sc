import com.directv.dap.hadoop.oozie.converter._

val src = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<workflow-app name=\"DMS-UDM-Transform-Workflow\" xmlns=\"uri:oozie:workflow:0.4\">\n  " +
  "<start to=\"check-lock\"/>\n  <!-- Check does _RUNNING directory exist in vendor specific wf folder on HDFS (check lock) -->\n  <decision " +
  "name=\"check-lock\">\n    <switch>\n      <case to=\"acquire-job-lock\">                ${fs:exists(concat(wf:conf('oozie.wf.application.path')," +
  " '/_RUNNING')) == \"true\"}            </case>\n      <default to=\"acquire-job-lock\"/>\n    </switch>\n  </decision>\n  <!-- If _RUNNING " +
  "folder does not exist then crete this folder (acquire lock) -->\n  <action name=\"acquire-job-lock\">\n    <fs>\n      <mkdir path=\"${wf:conf" +
  "('oozie.wf.application.path')}/_RUNNING\"/>\n    </fs>\n    <ok to=\"job-start-auditlog-record\"/>\n    <error " +
  "to=\"job-start-auditlog-record\"/>\n  </action>\n  <action name=\"job-start-auditlog-record\">\n    <java>\n      " +
  "<job-tracker>${jobTracker}</job-tracker>\n      <name-node>${nameNode}</name-node>\n      <configuration>\n        <property>\n          " +
  "<name>mapred.job.queue.name</name>\n          <value>${queueName}</value>\n        </property>\n      </configuration>\n      <main-class>com" +
  ".directv.vd.auditlog.VDAuditLog</main-class>\n      <java-opts>-Xmx128m</java-opts>\n      <arg>-conf</arg>\n      <arg>vd-auditlog" +
  ".properties</arg>\n      <arg>-sid</arg>\n      <arg>${wf:id()}</arg>\n      <arg>-code</arg>\n      <arg>DMS_UDM_WF_03</arg>\n      " +
  "<arg>-severity</arg>\n      <arg>INFO</arg>\n      <arg>-msg</arg>\n      <arg>DMS-UDM-WF Job started</arg>\n      <file>lib/vd-auditlog" +
  ".properties#vd-auditlog.properties</file>\n    </java>\n    <ok to=\"end\"/>\n    <error to=\"end\"/>\n  </action>\n\n  <end " +
  "name=\"end\"/>\n</workflow-app>"
val conv1 = new WorkflowToGraphConverterImpl_0_4
val conv2 = new GraphToWorkflowConverterImpl_0_4
val graph = conv1.convertToGraph(src)
val wfApp = conv2.toWorkflow(graph)
val xml = conv2.toWorkflowString(graph)
