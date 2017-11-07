package com.directv.hw.hadoop.oozie.bindings.hive_action_0_3

import java.io.InputStream
import java.lang.reflect.Type

import com.directv.hw.core.exception.DapException
import com.directv.hw.hadoop.oozie.bindings.hive_action_0_3.WorkflowSerializerCommon._
import com.directv.hw.hadoop.oozie.bindings.hive_action_0_3.binding._
import com.google.gson
import com.google.gson._
import resource._

import scala.collection.JavaConversions._
import scala.language.{implicitConversions, reflectiveCalls}

object pluginDescription {
  val jsonSchemaPath = "oozie/metadata/hive_action_0_3/jsonSchema.json"
  lazy val additionalSerializers = List[(Class[_], Class[_])] (
    (classOf[ACTION], classOf[ActionSerializer])
  )
  lazy val additionalDeserializers = List[(Class[_], Class[_])] (
    (classOf[ACTION], classOf[ActionDeserializer])
  )

  lazy val getJsonSchemaAsString: String = resourceAsString(jsonSchemaPath)

  def getJsonSchema: JsonElement = new JsonParser().parse(getJsonSchemaAsString).getAsJsonObject

  private def resourceAsString(path: String) = {
    managed(getClass.getClassLoader.getResourceAsStream(path)).map { is: InputStream =>
      scala.io.Source.fromInputStream(is).getLines().mkString("\n")
    }.opt.getOrElse(throw new DapException(s"Could not load resource [$path]"))
  }
  class extJsonHas(val json: JsonObject) {
    def hasStringData(key: String) = json.has(key) && json.get(key).getAsString != ""
  }
  implicit def jsonObject2extJsonHas(json: JsonObject): extJsonHas = new extJsonHas(json)
}

class ActionSerializer() extends JsonSerializer[ACTION] {
  @throws(classOf[gson.JsonParseException])
  override def serialize(action: ACTION, typeOfSrc: Type, context: JsonSerializationContext): JsonElement = {
    val result = new JsonObject
    result.addProperty("job-tracker", action.getJobTracker)
    result.addProperty("name-node", action.getNameNode)
    result.add("prepare", context.serialize(action.getPrepare, classOf[PREPARE]))
    if (action.getScript != null) {
      result.add("script", context.serialize(action.getScript))
    }
    result.add("job-xml", context.serialize(action.getJobXml))
    addConfiguration(result, action.getConfiguration, context)
    result.add("param", context.serialize(action.getParam))
    result.add("file", context.serialize(action.getFile))
    result.add("archive", context.serialize(action.getArchive))
    result
  }
}


class ActionDeserializer() extends JsonDeserializer[ACTION] {
  @throws(classOf[gson.JsonParseException])
  override def deserialize(actionJson: JsonElement, typeOfT: Type, context: JsonDeserializationContext) = {
    val json = actionJson.getAsJsonObject
    val action = new ACTION
    if (json != null) {
      action.setJobTracker(json.get("job-tracker").getAsString)
      action.setNameNode(json.get("name-node").getAsString)
      if (json.has("prepare")) {
        action.setPrepare(context.deserialize(json.get("prepare").getAsJsonObject, classOf[PREPARE]))
        if (action.getPrepare.getDelete.isEmpty && action.getPrepare.getMkdir.isEmpty) action.setPrepare(null)
      }
      if (json.has("job-xml")) {
        json.get("job-xml").getAsJsonArray foreach { jobXml => action.getJobXml.add(jobXml.getAsString) }
        if (action.getJobXml.isEmpty) action.setJobXml(null)
      }
      extractConfiguration(json, action, context)
      action.setScript(json.get("script").getAsString)
      if (json.has("param")) {
        json.get("param").getAsJsonArray foreach { param => action.getParam.add(param.getAsString) }
        if (action.getParam.isEmpty) action.setParam(null)
      }
      if (json.has("file")) {
        json.get("file").getAsJsonArray foreach { file => action.getFile.add(file.getAsString) }
        if (action.getFile.isEmpty) action.setFile(null)
      }
      if (json.has("archive")) {
        json.get("archive").getAsJsonArray foreach { archive => action.getArchive.add(archive.getAsString) }
        if (action.getArchive.isEmpty) action.setArchive(null)
      }
    }
    action
  }
}

object WorkflowSerializerCommon {
  type ConfigurationSettable = {
    def setConfiguration(configuration: CONFIGURATION)
  }

  def addConfiguration(jsonObject: JsonObject, configuration: CONFIGURATION, context: JsonSerializationContext) = {
    Option(configuration) flatMap (c => Option(c.getProperty)) withFilter (_.nonEmpty) foreach { properties =>
      val array = new JsonArray
      properties foreach { property =>
        array.add(context.serialize(property, classOf[CONFIGURATION.Property]))
      }
      jsonObject.add("property", array)
    }
  }

  def extractConfiguration(json: JsonObject, target: ConfigurationSettable, context: JsonDeserializationContext) = {
    if (json.has("property")) {
      val jsonArray: JsonArray = json.get("property").getAsJsonArray
      if (jsonArray.nonEmpty) {
        val configuration = new CONFIGURATION()
        jsonArray foreach { property =>
          configuration.getProperty.add(context.deserialize(property.getAsJsonObject, classOf[CONFIGURATION.Property]))
        }
        target.setConfiguration(configuration)
      }
    }
  }
}
