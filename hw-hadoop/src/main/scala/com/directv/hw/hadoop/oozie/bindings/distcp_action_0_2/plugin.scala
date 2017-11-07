package com.directv.hw.hadoop.oozie.bindings.distcp_action_0_2

import java.io.InputStream
import java.lang.reflect.Type

import com.directv.hw.core.exception.DapException
import com.directv.hw.hadoop.oozie.bindings.distcp_action_0_2.WorkflowSerializerCommon._
import com.directv.hw.hadoop.oozie.bindings.distcp_action_0_2.binding._
import com.google.gson
import com.google.gson._
import resource._

import scala.collection.JavaConversions._
import scala.language.{implicitConversions, reflectiveCalls}

object pluginDescription {
  val jsonSchemaPath = "oozie/metadata/distcp_action_0_2/jsonSchema.json"
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
  override def serialize(action: ACTION, typeOfSrc: Type, context: JsonSerializationContext): JsonElement = {
    val result = new JsonObject
    if (action.getJobTracker != null) result.addProperty("job-tracker", action.getJobTracker)
    if (action.getNameNode != null) result.addProperty("name-node", action.getNameNode)
    result.add("prepare", context.serialize(action.getPrepare, classOf[PREPARE]))
    addConfiguration(result, action.getConfiguration, context)
    if (action.getJavaOpts != null) {
      result.addProperty("java-opts", action.getJavaOpts)
    }
    result.add("arg", context.serialize(action.getArg))
    result
  }
}

class ActionDeserializer() extends JsonDeserializer[ACTION] {
  @throws(classOf[gson.JsonParseException])
  override def deserialize(actionJson: JsonElement, typeOfT: Type, context: JsonDeserializationContext) = {
    import pluginDescription.jsonObject2extJsonHas
    val json = actionJson.getAsJsonObject
    val action = new ACTION
    if (json != null) {
      if (json.hasStringData("job-tracker")) action.setJobTracker(json.get("job-tracker").getAsString)
      if (json.hasStringData("name-node")) action.setNameNode(json.get("name-node").getAsString)
      if (json.has("prepare")) {
        action.setPrepare(context.deserialize(json.get("prepare").getAsJsonObject, classOf[PREPARE]))
        if (action.getPrepare.getDelete.isEmpty && action.getPrepare.getMkdir.isEmpty) action.setPrepare(null)
      }
      extractConfiguration(json, action, context)
      if (json.hasStringData("java-opts")) action.setJavaOpts(json.get("java-opts").getAsString)
      if (json.has("arg")) {
        json.get("arg").getAsJsonArray foreach { arg => action.getArg.add(arg.getAsString) }
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
