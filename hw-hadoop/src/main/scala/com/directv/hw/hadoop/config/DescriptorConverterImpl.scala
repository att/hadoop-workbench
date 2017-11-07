package com.directv.hw.hadoop.config

import com.directv.hw.hadoop.template.model.ComponentDescriptor
import spray.httpx.SprayJsonSupport
import spray.httpx.marshalling.MetaMarshallers
import spray.json.DefaultJsonProtocol
import spray.json._

class DescriptorConverterImpl extends DescriptorConverter
  with DefaultJsonProtocol with MetaMarshallers {

  implicit val descriptorFormat = jsonFormat7(ComponentDescriptor)

  override def parse(descriptor: String): ComponentDescriptor = {
    descriptor.parseJson.convertTo[ComponentDescriptor]
  }

  override def marshall(descriptor: ComponentDescriptor): String = {
    descriptor.toJson.prettyPrint
  }
}
