package com.directv.hw.hadoop.model

import java.nio.charset.StandardCharsets

object MetaFile {
  val metaDir = "meta"
  val compDesc = "component.json"
  val bundleDescPath = metaDir + "/bundle.json"
  val compDescPath = metaDir + "/" + compDesc // Don't touch !!!
  val charset = StandardCharsets.UTF_8
}
