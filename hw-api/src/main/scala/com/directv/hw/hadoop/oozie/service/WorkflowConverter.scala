package com.directv.hw.hadoop.oozie.service

case class ConversionOptions(isStrict: Boolean)

object WorkflowConverter {
  val emptyConnectionTarget = null

  val startNodeId = "start"

  object Oozie {

    object types {
      val workflowControl = "workflow-control"
      val action = "action"
    }

    object subtypes {
      val start = "start"
      val end = "end"
    }

    object connectors {
      val ok = "ok"
      val error = "error"
      val out = "out"
      val `case` = "case"
      val default = "default"
    }

    object nodeTypes {
      val subWorkflow = "sub-workflow"
    }

    object mapreduce {
      val commonKeys = List("mapred.job.queue.name", "mapred.input.dir", "mapred.output.dir")
      val versionSelectKeys = Set("mapred.mapper.new-api", "mapred.reducer.new-api")
      val versionSelectValue = "true"
      val v1Keys = List("mapred.mapper.class", "mapred.reducer.class")
      val v2Keys = List("mapreduce.map.class", "mapreduce.reduce.class", "mapred.output.key.class", "mapred.output.value.class")
    }
  }
}
