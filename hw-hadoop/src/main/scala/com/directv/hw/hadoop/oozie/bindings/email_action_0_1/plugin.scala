package com.directv.hw.hadoop.oozie.bindings.email_action_0_1

import java.io.InputStream
import java.lang.reflect.Type

import com.directv.hw.core.exception.DapException
import com.directv.hw.hadoop.oozie.bindings.email_action_0_1.binding._
import com.google.gson
import com.google.gson._
import resource._

import scala.language.implicitConversions

object pluginDescription {
  val jsonSchemaPath = "oozie/metadata/email_action_0_1/jsonSchema.json"
  lazy val additionalSerializers = List[(Class[_], Class[_])] (
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

class ActionDeserializer() extends JsonDeserializer[ACTION] {
  @throws(classOf[gson.JsonParseException])
  override def deserialize(actionJson: JsonElement, typeOfT: Type, context: JsonDeserializationContext) = {
    import pluginDescription.jsonObject2extJsonHas
    val json = actionJson.getAsJsonObject
    val action = new ACTION
    if (json != null) {
      action.setTo(json.get("to").getAsString)
      if (json.hasStringData("cc")) action.setCc(json.get("cc").getAsString)
      action.setSubject(json.get("subject").getAsString)
      action.setBody(json.get("body").getAsString)
    }
    action
  }
}
