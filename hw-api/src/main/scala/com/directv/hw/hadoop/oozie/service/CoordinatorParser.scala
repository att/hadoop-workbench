package com.directv.hw.hadoop.oozie.service

import com.directv.hw.core.exception.ParseException
import com.directv.hw.hadoop.oozie.model.AppInfo

trait CoordinatorParser {

  @throws[ParseException]
  def parseInfo(string: String): AppInfo
}
