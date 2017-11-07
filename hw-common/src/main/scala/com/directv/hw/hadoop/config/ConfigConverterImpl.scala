package com.directv.hw.hadoop.config

import java.io.{StringReader, StringWriter}
import javax.xml.bind.{JAXBContext, JAXBException, Marshaller}

import com.directv.hw.core.exception.{ConfigurationException, DapException}
import com.directv.hw.hadoop.config.bindings.Configuration

import scala.collection.JavaConverters._

class ConfigConverterImpl extends ConfigConverter {
  override def toConfig(xml: String): List[ConfigEntry] = {
    val config = try {
      val reader = new StringReader(xml)
      val jaxbContext: JAXBContext = JAXBContext.newInstance(classOf[Configuration])
      val unmarshaller = jaxbContext.createUnmarshaller()
      unmarshaller.unmarshal(reader).asInstanceOf[Configuration]
    } catch {
      case e: JAXBException => throw ConfigurationException("Unable to parse config", e)
      case e: Exception => throw ConfigurationException("Unable to read config", e)
    }
    config.getProperty.asScala.map { property =>
      //noinspection IfElseToOption, java compatibility
      val business: Option[Boolean] = if (property.isBusiness == null) None else Some(property.isBusiness)
      ConfigEntry(property.getName, property.getValue, Option(property.getDescription), business)
    }.toList
  }

  override def toConfigXml(entries: Iterable[ConfigEntry]): String = {
    val factory = new com.directv.hw.hadoop.config.bindings.ObjectFactory
    var xmlConfig = factory.createConfiguration()
    entries foreach { entry =>
      var property = factory.createProperty()
      property.setName(entry.key)
      property.setValue(entry.value)
      val orNull: String = entry.description.orNull
      property.setDescription(orNull)
      if (entry.business.isDefined) {
        property.setBusiness(entry.business.get)
      }

      xmlConfig.getProperty.add(property)
    }

    val writer = new StringWriter()
    val context = JAXBContext.newInstance(classOf[Configuration])
    val marshaller: Marshaller = context.createMarshaller()
    marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, true)
    marshaller.marshal(xmlConfig, writer)
    writer.toString
  }
}
