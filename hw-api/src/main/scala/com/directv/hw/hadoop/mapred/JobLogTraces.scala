package com.directv.hw.hadoop.mapred

case class JobLogTraces(stdOut: String, stdErr: String, syslog: String)
case class JobLog(appType: String, jobLogTraces: JobLogTraces)
