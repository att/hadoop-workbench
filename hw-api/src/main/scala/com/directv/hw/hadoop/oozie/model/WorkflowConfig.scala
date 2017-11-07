package com.directv.hw.hadoop.oozie.model

import com.directv.hw.hadoop.config.ConfigEntry
import com.directv.hw.hadoop.model.ParsedContent

case class WorkflowConfig(config: List[ConfigEntry]) extends ParsedContent
