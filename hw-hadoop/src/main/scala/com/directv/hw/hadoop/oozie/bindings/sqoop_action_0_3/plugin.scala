package com.directv.hw.hadoop.oozie.bindings.sqoop_action_0_3

import java.io.InputStream
import java.lang.reflect.Type

import com.directv.hw.core.exception.DapException
import com.directv.hw.hadoop.oozie.bindings.sqoop_action_0_3.WorkflowSerializerCommon._
import com.directv.hw.hadoop.oozie.bindings.sqoop_action_0_3.binding.{ACTION, CONFIGURATION, PREPARE}
import com.google.gson
import com.google.gson._
import resource._

import scala.collection.JavaConversions._
import scala.language.{implicitConversions, reflectiveCalls}

object pluginDescription {
  val jsonSchemaPath = "oozie/metadata/sqoop_action_0_3/jsonSchema.json"
  lazy val additionalSerializers = List[(Class[_], Class[_])] (
    (classOf[ACTION], classOf[SqoopSerializer])
  )
  lazy val additionalDeserializers = List[(Class[_], Class[_])] (
    (classOf[ACTION], classOf[SqoopDeserializer])
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



class SqoopSerializer() extends JsonSerializer[ACTION] {
  override def serialize(sqoop: ACTION, typeOfSrc: Type, context:
  JsonSerializationContext): JsonElement = {
    val result = new JsonObject
    result.addProperty("job-tracker", sqoop.getJobTracker)
    result.addProperty("name-node", sqoop.getNameNode)
    result.add("prepare", context.serialize(sqoop.getPrepare, classOf[PREPARE]))
    result.add("job-xml", context.serialize(sqoop.getJobXml))
    addConfiguration(result, sqoop.getConfiguration, context)
    val commandOrArg = new JsonArray
    if (sqoop.getCommand != null) {
      val command = new JsonObject
      command.addProperty("command", sqoop.getCommand)
      commandOrArg.add(command)
    }
    if (sqoop.getArg != null) {
      val arg = new JsonObject
      arg.add("arg", context.serialize(sqoop.getArg))
      commandOrArg.add(arg)
    }
    result.add("commandOrArg", commandOrArg)
    result.add("file", context.serialize(sqoop.getFile))
    result.add("archive", context.serialize(sqoop.getArchive))
    result
  }
}

class SqoopDeserializer() extends JsonDeserializer[ACTION] {
  @throws(classOf[gson.JsonParseException])
  override def deserialize(sqoopJson: JsonElement, typeOfT: Type, context: JsonDeserializationContext) = {
    val json = sqoopJson.getAsJsonObject
    val sqoop = new ACTION
    if (json.has("job-tracker")) sqoop.setJobTracker(json.get("job-tracker").getAsString)
    if (json.has("name-node")) sqoop.setNameNode(json.get("name-node").getAsString)
    if (json.has("prepare")) sqoop.setPrepare(context.deserialize(json.get("prepare").getAsJsonObject, classOf[PREPARE]))
    if (json.has("job-xml")) json.get("job-xml").getAsJsonArray foreach {jobXml => sqoop.getJobXml.add(jobXml.getAsString)}
    extractConfiguration(json, sqoop, context)
    if (json.has("file")) json.get("file").getAsJsonArray foreach {file => sqoop.getFile.add(file.getAsString)}
    if (json.has("archive")) json.get("archive").getAsJsonArray foreach {archive => sqoop.getArchive.add(archive.getAsString)}
    val jsonArray: JsonArray = json.getAsJsonArray("commandOrArg")
    if (jsonArray != null && jsonArray.nonEmpty) {
      val commandOrArg = jsonArray.get(0).getAsJsonObject
      if (commandOrArg.has("command")) sqoop.setCommand(commandOrArg.get("command").getAsString)
      if (commandOrArg.has("arg")) commandOrArg.get("arg").getAsJsonArray foreach (arg => sqoop.getArg.add(arg.getAsString))
    }
    sqoop
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
