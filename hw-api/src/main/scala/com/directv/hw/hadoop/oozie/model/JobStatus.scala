package com.directv.hw.hadoop.oozie.model

import com.directv.hw.util.ParameterEnumeration

object JobStatus extends ParameterEnumeration {
  val prep = Value("PREP")
  val running = Value("RUNNING")
  val succeeded = Value("SUCCEEDED")
  val suspended = Value("SUSPENDED")
  val killed = Value("KILLED")
  val failed = Value("FAILED")
}
