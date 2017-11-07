package com.directv.hw.hadoop.oozie.bindings.ssh_action_0_2

import java.io.InputStream
import java.lang.reflect.Type

import com.directv.hw.core.exception.DapException
import com.directv.hw.hadoop.oozie.bindings.ssh_action_0_2.binding._
import com.google.gson
import com.google.gson._
import resource._

import scala.collection.JavaConversions._
import scala.language.implicitConversions


object pluginDescription {
  val jsonSchemaPath = "oozie/metadata/ssh_action_0_2/jsonSchema.json"
  lazy val additionalSerializers = List[(Class[_], Class[_])] (
    (classOf[ACTION], classOf[SshSerializer]),
    (classOf[FLAG], classOf[FlagSerializer])
  )
  lazy val additionalDeserializers = List[(Class[_], Class[_])] (
    (classOf[ACTION], classOf[SshDeserializer]),
    (classOf[FLAG], classOf[FlagDeserializer])
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



class SshSerializer() extends JsonSerializer[ACTION] {
  override def serialize(ssh: ACTION, typeOfSrc: Type, context:
  JsonSerializationContext): JsonElement = {
    val result = new JsonObject
    result.addProperty("host", ssh.getHost)
    result.addProperty("command", ssh.getCommand)
    val argsOrArg = new JsonArray
    if (ssh.getArg != null) {
      val arg = new JsonObject
      arg.add("arg", context.serialize(ssh.getArg))
      argsOrArg.add(arg)
    }
    if (ssh.getArgs != null) {
      val args = new JsonObject
      args.add("args", context.serialize(ssh.getArgs))
      argsOrArg.add(args)
    }
    result.add("argsOrArg", argsOrArg)
    result.addProperty("capture-output", ssh.getCaptureOutput != null)
    result
  }
}

class SshDeserializer() extends JsonDeserializer[ACTION] {
  @throws(classOf[gson.JsonParseException])
  override def deserialize(sshJson: JsonElement, typeOfT: Type, context: JsonDeserializationContext) = {
    val json = sshJson.getAsJsonObject
    val ssh = new ACTION
    ssh.setHost(json.get("host").getAsString)
    ssh.setCommand(json.get("command").getAsString)
    if (json.has("argsOrArg")) json.getAsJsonArray("argsOrArg") foreach { choice ⇒
      val argsOrArg = choice.getAsJsonObject
      if (argsOrArg.has("arg")) argsOrArg.get("arg").getAsJsonArray foreach (arg => ssh.getArg.add(arg.getAsString))
      if (argsOrArg.has("args")) argsOrArg.get("args").getAsJsonArray foreach (args => ssh.getArgs.add(args.getAsString))
    }
    if (json.has("capture-output")) if (json.get("capture-output").getAsBoolean) ssh.setCaptureOutput(new FLAG)
    ssh
  }

}

class FlagSerializer() extends JsonSerializer[FLAG] {
  override def serialize(flag: FLAG, typeOfSrc: Type, context: JsonSerializationContext): JsonElement = {
    new JsonPrimitive(flag != null)
  }
}

class FlagDeserializer() extends JsonDeserializer[FLAG] {
  @throws(classOf[gson.JsonParseException])
  override def deserialize(json: JsonElement, typeOfT: Type, context: JsonDeserializationContext) = {
    if (json.getAsBoolean) new FLAG else null
  }
}
