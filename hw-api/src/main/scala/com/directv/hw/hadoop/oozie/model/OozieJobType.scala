package com.directv.hw.hadoop.oozie.model

import com.directv.hw.util.ParameterEnumeration

object OozieJobType extends ParameterEnumeration {
  val workflow = Value("workflow")
  val coordinator = Value("coordinator")
}
