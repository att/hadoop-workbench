package com.directv.hw.hadoop.template.injest.oozie.model

import com.directv.hw.hadoop.template.model.{Template, ComponentInfo}

case class OozieNodeTemplate(actionSubtype: String, version: String, info: ComponentInfo) extends Template