package com.directv.hw.web.ingest.oozie.model

case class TypeMetadata(`types`: List[NodeType], typeRestrictions: Map[String, String], typeWarnings: Map[String, String],
                         connectionRestrictions: List[ConnectionRestriction], connectionWarnings: List[ConnectionRestriction])

case class NodeType(name: String, restrictions: Map[String, String], warnings: Map[String, String])
case class ConnectionRestriction(`type`: String, from: Option[String], to: Option[String], minOccurs: Option[Int], maxOccurs: Option[Int])
case class NodeProperty(name: String, `type`: String, required: Boolean, default: Option[String])
case class NodeSubtype(name: String, properties: List[NodeProperty])
case class SubtypeMetadata(subtypes: Map[String, List[NodeSubtype]])


