package com.directv.hw.hadoop.template.model

case class ComponentDescriptor(`type`: String,
                               artifactId: Option[String],
                               name: Option[String],
                               version: Option[String],
                               description: Option[String] = None,
                               team: Option[String] = None,
                               properties: Option[Map[String, String]] = None)

