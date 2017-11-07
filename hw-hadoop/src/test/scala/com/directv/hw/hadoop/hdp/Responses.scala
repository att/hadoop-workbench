package com.directv.hw.hadoop.hdp

object JsonResponses {
  val getClustersWrong=
    """
      |{
      |  "href" : "http://nn.com:8080/api/v1/clusters?fields=Clusters/cluster_id&Clusters/cluster_name",
      |  "error_key" : [
      |    {
      |      "href" : "http://nn.com:8080/api/v1/clusters/Cluster",
      |      "Clusters" : {
      |        "cluster_id" : 2,
      |        "cluster_name" : "Cluster",
      |        "version" : "HDP-2.3"
      |      }
      |    }
      |  ]
      |}
    """.stripMargin

  val getClusters =
    """{
      |  "href" : "http://nn.com:8080/api/v1/clusters?fields=Clusters/cluster_id&Clusters/cluster_name",
      |  "items" : [
      |    {
      |      "href" : "http://nn.com:8080/api/v1/clusters/Cluster",
      |      "Clusters" : {
      |        "cluster_id" : 2,
      |        "cluster_name" : "Cluster",
      |        "version" : "HDP-2.3"
      |      }
      |    }
      |  ]
      |}
    """.stripMargin

  val getHosts =
    """ {
      |  "href" : "http://nn.com:8080/api/v1/hosts?Hosts/cluster_name=Cluster&fields=Hosts/host_name,Hosts/ip",
      |  "items" : [
      |    {
      |      "href" : "http://nn.com:8080/api/v1/hosts/nn.com",
      |      "Hosts" : {
      |        "cluster_name" : "Cluster",
      |        "host_name" : "nn.com",
      |        "ip" : "172.24.103.157"
      |      }
      |    }
      |  ]
      |}
    """.stripMargin

  val getHost =
    """ {
      |  "href" : "http://nn.com:8080/api/v1/hosts?fields=Hosts/host_name,Hosts/ip&Hosts/cluster_name=Cluster&Hosts/host_name=nn.com",
      |  "items" : [
      |    {
      |      "href" : "http://nn.com:8080/api/v1/hosts/nn.com",
      |      "Hosts" : {
      |        "cluster_name" : "Cluster",
      |        "host_name" : "nn.com",
      |        "ip" : "172.24.103.157"
      |      }
      |    }
      |  ]
      |}
    """.stripMargin

  val getNameNode=
    """
      |{
      |  "href" : "http://nn.com:8080/api/v1/clusters/Cluster/configurations/service_config_versions?service_name=HDFS&is_current=true",
      |  "items" : [
      |    {
      |      "href" : "http://nn.com:8080/api/v1/clusters/Cluster/configurations/service_config_versions?service_name=HDFS&service_config_version=6",
      |      "cluster_name" : "Cluster",
      |      "configurations" : [
      |        {
      |          "Config" : {
      |            "cluster_name" : "Cluster",
      |            "stack_id" : "HDP-2.3"
      |          },
      |          "type" : "hadoop-env",
      |          "tag" : "version1",
      |          "version" : 1,
      |          "properties" : {
      |            "content" : "\n# Set Hadoop-specific environment variables here.\n\n# The only required environment variable is JAVA_HOME.  All others are\n# optional.  When running a distributed configuration it is best to\n# set JAVA_HOME in this file, so that it is correctly defined on\n# remote nodes.\n\n# The java implementation to use.  Required.\nexport JAVA_HOME={{java_home}}\nexport HADOOP_HOME_WARN_SUPPRESS=1\n\n# Hadoop home directory\nexport HADOOP_HOME=${HADOOP_HOME:-{{hadoop_home}}}\n\n# Hadoop Configuration Directory\n\n{# this is different for HDP1 #}\n# Path to jsvc required by secure HDP 2.0 datanode\nexport JSVC_HOME={{jsvc_path}}\n\n\n# The maximum amount of heap to use, in MB. Default is 1000.\nexport HADOOP_HEAPSIZE=\"{{hadoop_heapsize}}\"\n\nexport HADOOP_NAMENODE_INIT_HEAPSIZE=\"-Xms{{namenode_heapsize}}\"\n\n# Extra Java runtime options.  Empty by default.\nexport HADOOP_OPTS=\"-Djava.net.preferIPv4Stack=true ${HADOOP_OPTS}\"\n\n# Command specific options appended to HADOOP_OPTS when specified\nHADOOP_JOBTRACKER_OPTS=\"-server -XX:ParallelGCThreads=8 -XX:+UseConcMarkSweepGC -XX:ErrorFile={{hdfs_log_dir_prefix}}/$USER/hs_err_pid%p.log -XX:NewSize={{jtnode_opt_newsize}} -XX:MaxNewSize={{jtnode_opt_maxnewsize}} -Xloggc:{{hdfs_log_dir_prefix}}/$USER/gc.log-`date +'%Y%m%d%H%M'` -verbose:gc -XX:+PrintGCDetails -XX:+PrintGCTimeStamps -XX:+PrintGCDateStamps -Xmx{{jtnode_heapsize}} -Dhadoop.security.logger=INFO,DRFAS -Dmapred.audit.logger=INFO,MRAUDIT -Dhadoop.mapreduce.jobsummary.logger=INFO,JSA ${HADOOP_JOBTRACKER_OPTS}\"\n\nHADOOP_TASKTRACKER_OPTS=\"-server -Xmx{{ttnode_heapsize}} -Dhadoop.security.logger=ERROR,console -Dmapred.audit.logger=ERROR,console ${HADOOP_TASKTRACKER_OPTS}\"\n\n{% if java_version < 8 %}\nSHARED_HADOOP_NAMENODE_OPTS=\"-server -XX:ParallelGCThreads=8 -XX:+UseConcMarkSweepGC -XX:ErrorFile={{hdfs_log_dir_prefix}}/$USER/hs_err_pid%p.log -XX:NewSize={{namenode_opt_newsize}} -XX:MaxNewSize={{namenode_opt_maxnewsize}} -XX:PermSize={{namenode_opt_permsize}} -XX:MaxPermSize={{namenode_opt_maxpermsize}} -Xloggc:{{hdfs_log_dir_prefix}}/$USER/gc.log-`date +'%Y%m%d%H%M'` -verbose:gc -XX:+PrintGCDetails -XX:+PrintGCTimeStamps -XX:+PrintGCDateStamps -Xms{{namenode_heapsize}} -Xmx{{namenode_heapsize}} -Dhadoop.security.logger=INFO,DRFAS -Dhdfs.audit.logger=INFO,DRFAAUDIT\"\nexport HADOOP_NAMENODE_OPTS=\"${SHARED_HADOOP_NAMENODE_OPTS} -XX:OnOutOfMemoryError=\\\"/usr/hdp/current/hadoop-hdfs-namenode/bin/kill-name-node\\\" -Dorg.mortbay.jetty.Request.maxFormContentSize=-1 ${HADOOP_NAMENODE_OPTS}\"\nexport HADOOP_DATANODE_OPTS=\"-server -XX:ParallelGCThreads=4 -XX:+UseConcMarkSweepGC -XX:ErrorFile=/var/log/hadoop/$USER/hs_err_pid%p.log -XX:NewSize=200m -XX:MaxNewSize=200m -XX:PermSize=128m -XX:MaxPermSize=256m -Xloggc:/var/log/hadoop/$USER/gc.log-`date +'%Y%m%d%H%M'` -verbose:gc -XX:+PrintGCDetails -XX:+PrintGCTimeStamps -XX:+PrintGCDateStamps -Xms{{dtnode_heapsize}} -Xmx{{dtnode_heapsize}} -Dhadoop.security.logger=INFO,DRFAS -Dhdfs.audit.logger=INFO,DRFAAUDIT ${HADOOP_DATANODE_OPTS}\"\n\nexport HADOOP_SECONDARYNAMENODE_OPTS=\"${SHARED_HADOOP_NAMENODE_OPTS} -XX:OnOutOfMemoryError=\\\"/usr/hdp/current/hadoop-hdfs-secondarynamenode/bin/kill-secondary-name-node\\\" ${HADOOP_SECONDARYNAMENODE_OPTS}\"\n\n# The following applies to multiple commands (fs, dfs, fsck, distcp etc)\nexport HADOOP_CLIENT_OPTS=\"-Xmx${HADOOP_HEAPSIZE}m -XX:MaxPermSize=512m $HADOOP_CLIENT_OPTS\"\n\n{% else %}\nSHARED_HADOOP_NAMENODE_OPTS=\"-server -XX:ParallelGCThreads=8 -XX:+UseConcMarkSweepGC -XX:ErrorFile={{hdfs_log_dir_prefix}}/$USER/hs_err_pid%p.log -XX:NewSize={{namenode_opt_newsize}} -XX:MaxNewSize={{namenode_opt_maxnewsize}} -Xloggc:{{hdfs_log_dir_prefix}}/$USER/gc.log-`date +'%Y%m%d%H%M'` -verbose:gc -XX:+PrintGCDetails -XX:+PrintGCTimeStamps -XX:+PrintGCDateStamps -Xms{{namenode_heapsize}} -Xmx{{namenode_heapsize}} -Dhadoop.security.logger=INFO,DRFAS -Dhdfs.audit.logger=INFO,DRFAAUDIT\"\nexport HADOOP_NAMENODE_OPTS=\"${SHARED_HADOOP_NAMENODE_OPTS} -XX:OnOutOfMemoryError=\\\"/usr/hdp/current/hadoop-hdfs-namenode/bin/kill-name-node\\\" -Dorg.mortbay.jetty.Request.maxFormContentSize=-1 ${HADOOP_NAMENODE_OPTS}\"\nexport HADOOP_DATANODE_OPTS=\"-server -XX:ParallelGCThreads=4 -XX:+UseConcMarkSweepGC -XX:ErrorFile=/var/log/hadoop/$USER/hs_err_pid%p.log -XX:NewSize=200m -XX:MaxNewSize=200m -Xloggc:/var/log/hadoop/$USER/gc.log-`date +'%Y%m%d%H%M'` -verbose:gc -XX:+PrintGCDetails -XX:+PrintGCTimeStamps -XX:+PrintGCDateStamps -Xms{{dtnode_heapsize}} -Xmx{{dtnode_heapsize}} -Dhadoop.security.logger=INFO,DRFAS -Dhdfs.audit.logger=INFO,DRFAAUDIT ${HADOOP_DATANODE_OPTS}\"\n\nexport HADOOP_SECONDARYNAMENODE_OPTS=\"${SHARED_HADOOP_NAMENODE_OPTS} -XX:OnOutOfMemoryError=\\\"/usr/hdp/current/hadoop-hdfs-secondarynamenode/bin/kill-secondary-name-node\\\" ${HADOOP_SECONDARYNAMENODE_OPTS}\"\n\n# The following applies to multiple commands (fs, dfs, fsck, distcp etc)\nexport HADOOP_CLIENT_OPTS=\"-Xmx${HADOOP_HEAPSIZE}m $HADOOP_CLIENT_OPTS\"\n{% endif %}\n\nHADOOP_NFS3_OPTS=\"-Xmx{{nfsgateway_heapsize}}m -Dhadoop.security.logger=ERROR,DRFAS ${HADOOP_NFS3_OPTS}\"\nHADOOP_BALANCER_OPTS=\"-server -Xmx{{hadoop_heapsize}}m ${HADOOP_BALANCER_OPTS}\"\n\n\n# On secure datanodes, user to run the datanode as after dropping privileges\nexport HADOOP_SECURE_DN_USER=${HADOOP_SECURE_DN_USER:-{{hadoop_secure_dn_user}}}\n\n# Extra ssh options.  Empty by default.\nexport HADOOP_SSH_OPTS=\"-o ConnectTimeout=5 -o SendEnv=HADOOP_CONF_DIR\"\n\n# Where log files are stored.  $HADOOP_HOME/logs by default.\nexport HADOOP_LOG_DIR={{hdfs_log_dir_prefix}}/$USER\n\n# History server logs\nexport HADOOP_MAPRED_LOG_DIR={{mapred_log_dir_prefix}}/$USER\n\n# Where log files are stored in the secure data environment.\nexport HADOOP_SECURE_DN_LOG_DIR={{hdfs_log_dir_prefix}}/$HADOOP_SECURE_DN_USER\n\n# File naming remote slave hosts.  $HADOOP_HOME/conf/slaves by default.\n# export HADOOP_SLAVES=${HADOOP_HOME}/conf/slaves\n\n# host:path where hadoop code should be rsync'd from.  Unset by default.\n# export HADOOP_MASTER=master:/home/$USER/src/hadoop\n\n# Seconds to sleep between slave commands.  Unset by default.  This\n# can be useful in large clusters, where, e.g., slave rsyncs can\n# otherwise arrive faster than the master can service them.\n# export HADOOP_SLAVE_SLEEP=0.1\n\n# The directory where pid files are stored. /tmp by default.\nexport HADOOP_PID_DIR={{hadoop_pid_dir_prefix}}/$USER\nexport HADOOP_SECURE_DN_PID_DIR={{hadoop_pid_dir_prefix}}/$HADOOP_SECURE_DN_USER\n\n# History server pid\nexport HADOOP_MAPRED_PID_DIR={{mapred_pid_dir_prefix}}/$USER\n\nYARN_RESOURCEMANAGER_OPTS=\"-Dyarn.server.resourcemanager.appsummary.logger=INFO,RMSUMMARY\"\n\n# A string representing this instance of hadoop. $USER by default.\nexport HADOOP_IDENT_STRING=$USER\n\n# The scheduling priority for daemon processes.  See 'man nice'.\n\n# export HADOOP_NICENESS=10\n\n# Use libraries from standard classpath\nJAVA_JDBC_LIBS=\"\"\n\n#Add libraries required by mysql connector\nfor jarFile in `ls /usr/share/java/*mysql* 2>/dev/null`\ndo\n  JAVA_JDBC_LIBS=${JAVA_JDBC_LIBS}:$jarFile\ndone\n\n# Add libraries required by oracle connector\nfor jarFile in `ls /usr/share/java/*ojdbc* 2>/dev/null`\ndo\n  JAVA_JDBC_LIBS=${JAVA_JDBC_LIBS}:$jarFile\ndone\n\nexport HADOOP_CLASSPATH=${HADOOP_CLASSPATH}:${JAVA_JDBC_LIBS}\n\n# Setting path to hdfs command line\nexport HADOOP_LIBEXEC_DIR={{hadoop_libexec_dir}}\n\n# Mostly required for hadoop 2.0\nexport JAVA_LIBRARY_PATH=${JAVA_LIBRARY_PATH}\n\nexport HADOOP_OPTS=\"-Dhdp.version=$HDP_VERSION $HADOOP_OPTS\"",
      |            "dtnode_heapsize" : "1024m",
      |            "hadoop_heapsize" : "1024",
      |            "hadoop_pid_dir_prefix" : "/var/run/hadoop",
      |            "hadoop_root_logger" : "INFO,RFA",
      |            "hdfs_log_dir_prefix" : "/var/log/hadoop",
      |            "hdfs_user" : "hdfs",
      |            "hdfs_user_nofile_limit" : "128000",
      |            "hdfs_user_nproc_limit" : "65536",
      |            "keyserver_host" : " ",
      |            "keyserver_port" : "",
      |            "namenode_heapsize" : "1024m",
      |            "namenode_opt_maxnewsize" : "128m",
      |            "namenode_opt_maxpermsize" : "256m",
      |            "namenode_opt_newsize" : "128m",
      |            "namenode_opt_permsize" : "128m",
      |            "nfsgateway_heapsize" : "1024",
      |            "proxyuser_group" : "users"
      |          },
      |          "properties_attributes" : { }
      |        },
      |        {
      |          "Config" : {
      |            "cluster_name" : "Cluster",
      |            "stack_id" : "HDP-2.3"
      |          },
      |          "type" : "hadoop-policy",
      |          "tag" : "version1",
      |          "version" : 1,
      |          "properties" : {
      |            "security.admin.operations.protocol.acl" : "hadoop",
      |            "security.client.datanode.protocol.acl" : "*",
      |            "security.client.protocol.acl" : "*",
      |            "security.datanode.protocol.acl" : "*",
      |            "security.inter.datanode.protocol.acl" : "*",
      |            "security.inter.tracker.protocol.acl" : "*",
      |            "security.job.client.protocol.acl" : "*",
      |            "security.job.task.protocol.acl" : "*",
      |            "security.namenode.protocol.acl" : "*",
      |            "security.refresh.policy.protocol.acl" : "hadoop",
      |            "security.refresh.usertogroups.mappings.protocol.acl" : "hadoop"
      |          },
      |          "properties_attributes" : { }
      |        },
      |        {
      |          "Config" : {
      |            "cluster_name" : "Cluster",
      |            "stack_id" : "HDP-2.3"
      |          },
      |          "type" : "hdfs-log4j",
      |          "tag" : "version1",
      |          "version" : 1,
      |          "properties" : {
      |            "content" : "\n#\n# Licensed to the Apache Software Foundation (ASF) under one\n# or more contributor license agreements.  See the NOTICE file\n# distributed with this work for additional information\n# regarding copyright ownership.  The ASF licenses this file\n# to you under the Apache License, Version 2.0 (the\n# \"License\"); you may not use this file except in compliance\n# with the License.  You may obtain a copy of the License at\n#\n#  http://www.apache.org/licenses/LICENSE-2.0\n#\n# Unless required by applicable law or agreed to in writing,\n# software distributed under the License is distributed on an\n# \"AS IS\" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY\n# KIND, either express or implied.  See the License for the\n# specific language governing permissions and limitations\n# under the License.\n#\n\n\n# Define some default values that can be overridden by system properties\n# To change daemon root logger use hadoop_root_logger in hadoop-env\nhadoop.root.logger=INFO,console\nhadoop.log.dir=.\nhadoop.log.file=hadoop.log\n\n\n# Define the root logger to the system property \"hadoop.root.logger\".\nlog4j.rootLogger=${hadoop.root.logger}, EventCounter\n\n# Logging Threshold\nlog4j.threshhold=ALL\n\n#\n# Daily Rolling File Appender\n#\n\nlog4j.appender.DRFA=org.apache.log4j.DailyRollingFileAppender\nlog4j.appender.DRFA.File=${hadoop.log.dir}/${hadoop.log.file}\n\n# Rollver at midnight\nlog4j.appender.DRFA.DatePattern=.yyyy-MM-dd\n\n# 30-day backup\n#log4j.appender.DRFA.MaxBackupIndex=30\nlog4j.appender.DRFA.layout=org.apache.log4j.PatternLayout\n\n# Pattern format: Date LogLevel LoggerName LogMessage\nlog4j.appender.DRFA.layout.ConversionPattern=%d{ISO8601} %p %c: %m%n\n# Debugging Pattern format\n#log4j.appender.DRFA.layout.ConversionPattern=%d{ISO8601} %-5p %c{2} (%F:%M(%L)) - %m%n\n\n\n#\n# console\n# Add \"console\" to rootlogger above if you want to use this\n#\n\nlog4j.appender.console=org.apache.log4j.ConsoleAppender\nlog4j.appender.console.target=System.err\nlog4j.appender.console.layout=org.apache.log4j.PatternLayout\nlog4j.appender.console.layout.ConversionPattern=%d{yy/MM/dd HH:mm:ss} %p %c{2}: %m%n\n\n#\n# TaskLog Appender\n#\n\n#Default values\nhadoop.tasklog.taskid=null\nhadoop.tasklog.iscleanup=false\nhadoop.tasklog.noKeepSplits=4\nhadoop.tasklog.totalLogFileSize=100\nhadoop.tasklog.purgeLogSplits=true\nhadoop.tasklog.logsRetainHours=12\n\nlog4j.appender.TLA=org.apache.hadoop.mapred.TaskLogAppender\nlog4j.appender.TLA.taskId=${hadoop.tasklog.taskid}\nlog4j.appender.TLA.isCleanup=${hadoop.tasklog.iscleanup}\nlog4j.appender.TLA.totalLogFileSize=${hadoop.tasklog.totalLogFileSize}\n\nlog4j.appender.TLA.layout=org.apache.log4j.PatternLayout\nlog4j.appender.TLA.layout.ConversionPattern=%d{ISO8601} %p %c: %m%n\n\n#\n#Security audit appender\n#\nhadoop.security.logger=INFO,console\nhadoop.security.log.maxfilesize=256MB\nhadoop.security.log.maxbackupindex=20\nlog4j.category.SecurityLogger=${hadoop.security.logger}\nhadoop.security.log.file=SecurityAuth.audit\nlog4j.appender.DRFAS=org.apache.log4j.DailyRollingFileAppender\nlog4j.appender.DRFAS.File=${hadoop.log.dir}/${hadoop.security.log.file}\nlog4j.appender.DRFAS.layout=org.apache.log4j.PatternLayout\nlog4j.appender.DRFAS.layout.ConversionPattern=%d{ISO8601} %p %c: %m%n\nlog4j.appender.DRFAS.DatePattern=.yyyy-MM-dd\n\nlog4j.appender.RFAS=org.apache.log4j.RollingFileAppender\nlog4j.appender.RFAS.File=${hadoop.log.dir}/${hadoop.security.log.file}\nlog4j.appender.RFAS.layout=org.apache.log4j.PatternLayout\nlog4j.appender.RFAS.layout.ConversionPattern=%d{ISO8601} %p %c: %m%n\nlog4j.appender.RFAS.MaxFileSize=${hadoop.security.log.maxfilesize}\nlog4j.appender.RFAS.MaxBackupIndex=${hadoop.security.log.maxbackupindex}\n\n#\n# hdfs audit logging\n#\nhdfs.audit.logger=INFO,console\nlog4j.logger.org.apache.hadoop.hdfs.server.namenode.FSNamesystem.audit=${hdfs.audit.logger}\nlog4j.additivity.org.apache.hadoop.hdfs.server.namenode.FSNamesystem.audit=false\nlog4j.appender.DRFAAUDIT=org.apache.log4j.DailyRollingFileAppender\nlog4j.appender.DRFAAUDIT.File=${hadoop.log.dir}/hdfs-audit.log\nlog4j.appender.DRFAAUDIT.layout=org.apache.log4j.PatternLayout\nlog4j.appender.DRFAAUDIT.layout.ConversionPattern=%d{ISO8601} %p %c{2}: %m%n\nlog4j.appender.DRFAAUDIT.DatePattern=.yyyy-MM-dd\n\n#\n# NameNode metrics logging.\n# The default is to retain two namenode-metrics.log files up to 64MB each.\n#\nnamenode.metrics.logger=INFO,NullAppender\nlog4j.logger.NameNodeMetricsLog=${namenode.metrics.logger}\nlog4j.additivity.NameNodeMetricsLog=false\nlog4j.appender.NNMETRICSRFA=org.apache.log4j.RollingFileAppender\nlog4j.appender.NNMETRICSRFA.File=${hadoop.log.dir}/namenode-metrics.log\nlog4j.appender.NNMETRICSRFA.layout=org.apache.log4j.PatternLayout\nlog4j.appender.NNMETRICSRFA.layout.ConversionPattern=%d{ISO8601} %m%n\nlog4j.appender.NNMETRICSRFA.MaxBackupIndex=1\nlog4j.appender.NNMETRICSRFA.MaxFileSize=64MB\n\n#\n# mapred audit logging\n#\nmapred.audit.logger=INFO,console\nlog4j.logger.org.apache.hadoop.mapred.AuditLogger=${mapred.audit.logger}\nlog4j.additivity.org.apache.hadoop.mapred.AuditLogger=false\nlog4j.appender.MRAUDIT=org.apache.log4j.DailyRollingFileAppender\nlog4j.appender.MRAUDIT.File=${hadoop.log.dir}/mapred-audit.log\nlog4j.appender.MRAUDIT.layout=org.apache.log4j.PatternLayout\nlog4j.appender.MRAUDIT.layout.ConversionPattern=%d{ISO8601} %p %c{2}: %m%n\nlog4j.appender.MRAUDIT.DatePattern=.yyyy-MM-dd\n\n#\n# Rolling File Appender\n#\n\nlog4j.appender.RFA=org.apache.log4j.RollingFileAppender\nlog4j.appender.RFA.File=${hadoop.log.dir}/${hadoop.log.file}\n\n# Logfile size and and 30-day backups\nlog4j.appender.RFA.MaxFileSize=256MB\nlog4j.appender.RFA.MaxBackupIndex=10\n\nlog4j.appender.RFA.layout=org.apache.log4j.PatternLayout\nlog4j.appender.RFA.layout.ConversionPattern=%d{ISO8601} %-5p %c{2} - %m%n\nlog4j.appender.RFA.layout.ConversionPattern=%d{ISO8601} %-5p %c{2} (%F:%M(%L)) - %m%n\n\n\n# Custom Logging levels\n\nhadoop.metrics.log.level=INFO\n#log4j.logger.org.apache.hadoop.mapred.JobTracker=DEBUG\n#log4j.logger.org.apache.hadoop.mapred.TaskTracker=DEBUG\n#log4j.logger.org.apache.hadoop.fs.FSNamesystem=DEBUG\nlog4j.logger.org.apache.hadoop.metrics2=${hadoop.metrics.log.level}\n\n# Jets3t library\nlog4j.logger.org.jets3t.service.impl.rest.httpclient.RestS3Service=ERROR\n\n#\n# Null Appender\n# Trap security logger on the hadoop client side\n#\nlog4j.appender.NullAppender=org.apache.log4j.varia.NullAppender\n\n#\n# Event Counter Appender\n# Sends counts of logging messages at different severity levels to Hadoop Metrics.\n#\nlog4j.appender.EventCounter=org.apache.hadoop.log.metrics.EventCounter\n\n# Removes \"deprecated\" messages\nlog4j.logger.org.apache.hadoop.conf.Configuration.deprecation=WARN\n\n#\n# HDFS block state change log from block manager\n#\n# Uncomment the following to suppress normal block state change\n# messages from BlockManager in NameNode.\n#log4j.logger.BlockStateChange=WARN"
      |          },
      |          "properties_attributes" : { }
      |        },
      |        {
      |          "Config" : {
      |            "cluster_name" : "Cluster",
      |            "stack_id" : "HDP-2.3"
      |          },
      |          "type" : "ranger-hdfs-audit",
      |          "tag" : "version1",
      |          "version" : 1,
      |          "properties" : { },
      |          "properties_attributes" : { }
      |        },
      |        {
      |          "Config" : {
      |            "cluster_name" : "Cluster",
      |            "stack_id" : "HDP-2.3"
      |          },
      |          "type" : "ranger-hdfs-plugin-properties",
      |          "tag" : "version1",
      |          "version" : 1,
      |          "properties" : { },
      |          "properties_attributes" : { }
      |        },
      |        {
      |          "Config" : {
      |            "cluster_name" : "Cluster",
      |            "stack_id" : "HDP-2.3"
      |          },
      |          "type" : "ranger-hdfs-policymgr-ssl",
      |          "tag" : "version1",
      |          "version" : 1,
      |          "properties" : { },
      |          "properties_attributes" : { }
      |        },
      |        {
      |          "Config" : {
      |            "cluster_name" : "Cluster",
      |            "stack_id" : "HDP-2.3"
      |          },
      |          "type" : "ranger-hdfs-security",
      |          "tag" : "version1",
      |          "version" : 1,
      |          "properties" : { },
      |          "properties_attributes" : { }
      |        },
      |        {
      |          "Config" : {
      |            "cluster_name" : "Cluster",
      |            "stack_id" : "HDP-2.3"
      |          },
      |          "type" : "ssl-client",
      |          "tag" : "version1",
      |          "version" : 1,
      |          "properties" : {
      |            "ssl.client.keystore.location" : "/etc/security/clientKeys/keystore.jks",
      |            "ssl.client.keystore.password" : "bigdata",
      |            "ssl.client.keystore.type" : "jks",
      |            "ssl.client.truststore.location" : "/etc/security/clientKeys/all.jks",
      |            "ssl.client.truststore.password" : "bigdata",
      |            "ssl.client.truststore.reload.interval" : "10000",
      |            "ssl.client.truststore.type" : "jks"
      |          },
      |          "properties_attributes" : { }
      |        },
      |        {
      |          "Config" : {
      |            "cluster_name" : "Cluster",
      |            "stack_id" : "HDP-2.3"
      |          },
      |          "type" : "ssl-server",
      |          "tag" : "version1",
      |          "version" : 1,
      |          "properties" : {
      |            "ssl.server.keystore.keypassword" : "bigdata",
      |            "ssl.server.keystore.location" : "/etc/security/serverKeys/keystore.jks",
      |            "ssl.server.keystore.password" : "bigdata",
      |            "ssl.server.keystore.type" : "jks",
      |            "ssl.server.truststore.location" : "/etc/security/serverKeys/all.jks",
      |            "ssl.server.truststore.password" : "bigdata",
      |            "ssl.server.truststore.reload.interval" : "10000",
      |            "ssl.server.truststore.type" : "jks"
      |          },
      |          "properties_attributes" : { }
      |        },
      |        {
      |          "Config" : {
      |            "cluster_name" : "Cluster",
      |            "stack_id" : "HDP-2.3"
      |          },
      |          "type" : "core-site",
      |          "tag" : "version1449753077586",
      |          "version" : 2,
      |          "properties" : {
      |            "fs.defaultFS" : "hdfs://nn.com:8020",
      |            "fs.trash.interval" : "360",
      |            "ha.failover-controller.active-standby-elector.zk.op.retries" : "120",
      |            "hadoop.http.authentication.simple.anonymous.allowed" : "true",
      |            "hadoop.proxyuser.hcat.groups" : "users",
      |            "hadoop.proxyuser.hcat.hosts" : "nn.com",
      |            "hadoop.proxyuser.hdfs.groups" : "*",
      |            "hadoop.proxyuser.hdfs.hosts" : "*",
      |            "hadoop.proxyuser.hive.groups" : "*",
      |            "hadoop.proxyuser.hive.hosts" : "nn.com",
      |            "hadoop.proxyuser.oozie.groups" : "*",
      |            "hadoop.proxyuser.oozie.hosts" : "nn.com,localhost,127.0.0.1",
      |            "hadoop.security.auth_to_local" : "DEFAULT",
      |            "hadoop.security.authentication" : "simple",
      |            "hadoop.security.authorization" : "false",
      |            "hadoop.security.key.provider.path" : "",
      |            "io.compression.codecs" : "org.apache.hadoop.io.compress.GzipCodec,org.apache.hadoop.io.compress.DefaultCodec,org.apache.hadoop.io.compress.SnappyCodec",
      |            "io.file.buffer.size" : "131072",
      |            "io.serializations" : "org.apache.hadoop.io.serializer.WritableSerialization",
      |            "ipc.client.connect.max.retries" : "50",
      |            "ipc.client.connection.maxidletime" : "30000",
      |            "ipc.client.idlethreshold" : "8000",
      |            "ipc.server.tcpnodelay" : "true",
      |            "mapreduce.jobtracker.webinterface.trusted" : "false",
      |            "net.topology.script.file.name" : "/etc/hadoop/conf/topology_script.py"
      |          },
      |          "properties_attributes" : { }
      |        },
      |        {
      |          "Config" : {
      |            "cluster_name" : "Cluster",
      |            "stack_id" : "HDP-2.3"
      |          },
      |          "type" : "hdfs-site",
      |          "tag" : "version1450684418776",
      |          "version" : 5,
      |          "properties" : {
      |            "dfs.block.access.token.enable" : "true",
      |            "dfs.blockreport.initialDelay" : "120",
      |            "dfs.blocksize" : "134217728",
      |            "dfs.client.read.shortcircuit" : "true",
      |            "dfs.client.read.shortcircuit.streams.cache.size" : "4096",
      |            "dfs.client.retry.policy.enabled" : "false",
      |            "dfs.cluster.administrators" : " hdfs",
      |            "dfs.content-summary.limit" : "5000",
      |            "dfs.datanode.address" : "0.0.0.0:50010",
      |            "dfs.datanode.balance.bandwidthPerSec" : "6250000",
      |            "dfs.datanode.data.dir" : "/hadoop/hdfs/data",
      |            "dfs.datanode.data.dir.perm" : "750",
      |            "dfs.datanode.du.reserved" : "1073741824",
      |            "dfs.datanode.failed.volumes.tolerated" : "0",
      |            "dfs.datanode.http.address" : "0.0.0.0:50075",
      |            "dfs.datanode.https.address" : "0.0.0.0:50475",
      |            "dfs.datanode.ipc.address" : "0.0.0.0:8010",
      |            "dfs.datanode.max.transfer.threads" : "4096",
      |            "dfs.domain.socket.path" : "/var/lib/hadoop-hdfs/dn_socket",
      |            "dfs.encrypt.data.transfer.cipher.suites" : "AES/CTR/NoPadding",
      |            "dfs.encryption.key.provider.uri" : "",
      |            "dfs.heartbeat.interval" : "3",
      |            "dfs.hosts.exclude" : "/etc/hadoop/conf/dfs.exclude",
      |            "dfs.http.policy" : "HTTP_ONLY",
      |            "dfs.https.port" : "50470",
      |            "dfs.journalnode.edits.dir" : "/hadoop/hdfs/journalnode",
      |            "dfs.journalnode.http-address" : "0.0.0.0:8480",
      |            "dfs.journalnode.https-address" : "0.0.0.0:8481",
      |            "dfs.namenode.accesstime.precision" : "0",
      |            "dfs.namenode.audit.log.async" : "true",
      |            "dfs.namenode.avoid.read.stale.datanode" : "true",
      |            "dfs.namenode.avoid.write.stale.datanode" : "true",
      |            "dfs.namenode.checkpoint.dir" : "/hadoop/hdfs/namesecondary",
      |            "dfs.namenode.checkpoint.edits.dir" : "${dfs.namenode.checkpoint.dir}",
      |            "dfs.namenode.checkpoint.period" : "21600",
      |            "dfs.namenode.checkpoint.txns" : "1000000",
      |            "dfs.namenode.fslock.fair" : "false",
      |            "dfs.namenode.handler.count" : "100",
      |            "dfs.namenode.http-address" : "nn.com:50070",
      |            "dfs.namenode.https-address" : "nn.com:50470",
      |            "dfs.namenode.name.dir" : "/hadoop/hdfs/namenode",
      |            "dfs.namenode.name.dir.restore" : "true",
      |            "dfs.namenode.rpc-address" : "nn.com:8020",
      |            "dfs.namenode.safemode.threshold-pct" : "1",
      |            "dfs.namenode.secondary.http-address" : "nn.com:50090",
      |            "dfs.namenode.stale.datanode.interval" : "30000",
      |            "dfs.namenode.startup.delay.block.deletion.sec" : "3600",
      |            "dfs.namenode.write.stale.datanode.ratio" : "1.0f",
      |            "dfs.permissions.enabled" : "true",
      |            "dfs.permissions.superusergroup" : "hdfs",
      |            "dfs.replication" : "3",
      |            "dfs.replication.max" : "50",
      |            "dfs.support.append" : "true",
      |            "dfs.webhdfs.enabled" : "true",
      |            "fs.permissions.umask-mode" : "022",
      |            "nfs.exports.allowed.hosts" : "* rw",
      |            "nfs.file.dump.dir" : "/tmp/.hdfs-nfs"
      |          },
      |          "properties_attributes" : { }
      |        }
      |      ],
      |      "createtime" : 1450684419399,
      |      "group_id" : -1,
      |      "group_name" : "default",
      |      "hosts" : [ ],
      |      "is_cluster_compatible" : true,
      |      "is_current" : true,
      |      "service_config_version" : 6,
      |      "service_config_version_note" : "",
      |      "service_name" : "HDFS",
      |      "stack_id" : "HDP-2.3",
      |      "user" : "admin"
      |    }
      |  ]
      |}
    """.stripMargin

  val getServices=
    """{
      |  "href" : "http://nn.com:8080/api/v1/clusters/Cluster/services/?fields=ServiceInfo/service_name",
      |  "items" : [
      |    {
      |      "href" : "http://nn.com:8080/api/v1/clusters/Cluster/services/AMBARI_METRICS",
      |      "ServiceInfo" : {
      |        "cluster_name" : "Cluster",
      |        "service_name" : "AMBARI_METRICS"
      |      }
      |    },
      |    {
      |      "href" : "http://nn.com:8080/api/v1/clusters/Cluster/services/FLUME",
      |      "ServiceInfo" : {
      |        "cluster_name" : "Cluster",
      |        "service_name" : "FLUME"
      |      }
      |    },
      |    {
      |      "href" : "http://nn.com:8080/api/v1/clusters/Cluster/services/HDFS",
      |      "ServiceInfo" : {
      |        "cluster_name" : "Cluster",
      |        "service_name" : "HDFS"
      |      }
      |    },
      |    {
      |      "href" : "http://nn.com:8080/api/v1/clusters/Cluster/services/HIVE",
      |      "ServiceInfo" : {
      |        "cluster_name" : "Cluster",
      |        "service_name" : "HIVE"
      |      }
      |    },
      |    {
      |      "href" : "http://nn.com:8080/api/v1/clusters/Cluster/services/KAFKA",
      |      "ServiceInfo" : {
      |        "cluster_name" : "Cluster",
      |        "service_name" : "KAFKA"
      |      }
      |    },
      |    {
      |      "href" : "http://nn.com:8080/api/v1/clusters/Cluster/services/MAPREDUCE2",
      |      "ServiceInfo" : {
      |        "cluster_name" : "Cluster",
      |        "service_name" : "MAPREDUCE2"
      |      }
      |    },
      |    {
      |      "href" : "http://nn.com:8080/api/v1/clusters/Cluster/services/OOZIE",
      |      "ServiceInfo" : {
      |        "cluster_name" : "Cluster",
      |        "service_name" : "OOZIE"
      |      }
      |    },
      |    {
      |      "href" : "http://nn.com:8080/api/v1/clusters/Cluster/services/PIG",
      |      "ServiceInfo" : {
      |        "cluster_name" : "Cluster",
      |        "service_name" : "PIG"
      |      }
      |    },
      |    {
      |      "href" : "http://nn.com:8080/api/v1/clusters/Cluster/services/SPARK",
      |      "ServiceInfo" : {
      |        "cluster_name" : "Cluster",
      |        "service_name" : "SPARK"
      |      }
      |    },
      |    {
      |      "href" : "http://nn.com:8080/api/v1/clusters/Cluster/services/TEZ",
      |      "ServiceInfo" : {
      |        "cluster_name" : "Cluster",
      |        "service_name" : "TEZ"
      |      }
      |    },
      |    {
      |      "href" : "http://nn.com:8080/api/v1/clusters/Cluster/services/YARN",
      |      "ServiceInfo" : {
      |        "cluster_name" : "Cluster",
      |        "service_name" : "YARN"
      |      }
      |    },
      |    {
      |      "href" : "http://nn.com:8080/api/v1/clusters/Cluster/services/ZOOKEEPER",
      |      "ServiceInfo" : {
      |        "cluster_name" : "Cluster",
      |        "service_name" : "ZOOKEEPER"
      |      }
      |    }
      |  ]
      |}
      """.stripMargin
}
