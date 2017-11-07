package com.directv.hw.hadoop.oozie.bindings.ssh_action_0_1

import java.io.InputStream
import java.lang.reflect.Type

import com.directv.hw.core.exception.DapException
import com.directv.hw.hadoop.oozie.bindings.ssh_action_0_1.binding._
import com.google.gson
import com.google.gson._
import resource._

import scala.collection.JavaConversions._
import scala.language.implicitConversions

object pluginDescription {
  val jsonSchemaPath = "oozie/metadata/ssh_action_0_1/jsonSchema.json"
  lazy val additionalSerializers = List[(Class[_], Class[_])](
    (classOf[FLAG], classOf[FlagSerializer])
  )
  lazy val additionalDeserializers = List[(Class[_], Class[_])](
    (classOf[FLAG], classOf[FlagDeserializer]),
    (classOf[ACTION], classOf[ActionDeserializer])
  )

  lazy val getJsonSchemaAsString: String = resourceAsString(jsonSchemaPath)

  def getJsonSchema: JsonElement = new JsonParser().parse(getJsonSchemaAsString).getAsJsonObject

  private def resourceAsString(path: String) = {
    managed(getClass.getClassLoader.getResourceAsStream(path)).map { is: InputStream =>
      scala.io.Source.fromInputStream(is).getLines().mkString("\n")
    }.opt.getOrElse(throw new DapException(s"Could not load resource [$path]"))
  }

  implicit def jsonObject2extJsonHas(json: JsonObject): extJsonHas = new extJsonHas(json)

  class extJsonHas(val json: JsonObject) {
    def hasStringData(key: String) = json.has(key) && json.get(key).getAsString != ""
  }
}

class FlagSerializer() extends JsonSerializer[FLAG] {
    override def serialize(flag: FLAG, typeOfSrc: Type, context: JsonSerializationContext): JsonElement = {
      new JsonPrimitive(flag != null)
    }
  }

  class FlagDeserializer() extends JsonDeserializer[FLAG] {
    @throws (classOf[gson.JsonParseException])
    override def deserialize(json: JsonElement, typeOfT: Type, context: JsonDeserializationContext)  = {
      if (json.getAsBoolean) new FLAG else null
    }
  }

class ActionDeserializer() extends JsonDeserializer[ACTION] {
  @throws(classOf[gson.JsonParseException])
  override def deserialize(actionJson: JsonElement, typeOfT: Type, context: JsonDeserializationContext) = {
    val json = actionJson.getAsJsonObject
    val action = new ACTION
    if (json != null) {
      action.setHost(json.get("host").getAsString)
      action.setCommand(json.get("command").getAsString)
      if (json.has("args")) {
        json.get("args").getAsJsonArray foreach { args => action.getArgs.add(args.getAsString) }
      }
      if (json.has("capture-output")) if (json.get("capture-output").getAsBoolean) action.setCaptureOutput(new FLAG)
    }
    action
  }
}
