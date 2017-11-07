package com.directv.hw.oozie.service.plugin

import com.directv.hw.hadoop.config.ConfigConverterImpl
import com.directv.hw.hadoop.oozie.client._
import com.google.gson.GsonBuilder
import org.springframework.http.converter._
import org.springframework.http.converter.json.GsonHttpMessageConverter
import org.springframework.http.converter.support.AllEncompassingFormHttpMessageConverter
import org.springframework.http.converter.xml.SourceHttpMessageConverter
import ro.fortsoft.pf4j.{Extension, ExtensionPoint, Plugin, PluginWrapper}

import scala.collection.JavaConverters._

class OozieServicePlugin(pluginWrapper: PluginWrapper) extends Plugin(pluginWrapper)

@Extension
class OozieClientFactoryImpl extends ExtensionPoint with OozieClientFactory {

  private val gson = (new GsonBuilder).create
  private val gsonConverter = new GsonHttpMessageConverter
  gsonConverter.setGson(gson)

  private val configConverter = new ConfigConverterImpl

  override def getOozieClient(conf: OozieSimpleClientConfig): OozieClient = {
    val restTemplate = new DapRestTemplateImpl
    restTemplate.setMessageConverters(converters.asJava)
    new OozieClientImpl(restTemplate, conf.url, conf.user, configConverter)
  }

  override def getKrbOozieClient(conf: OozieKrbClientConfig): OozieClient = {
    val options = Map("refreshKrb5Config" -> "true")
    val restTemplate = new DapKrbRestTemplateImpl(conf.keytabPath, conf.principal, options)
    restTemplate.setMessageConverters(converters.asJava)
    new OozieClientImpl(restTemplate, conf.url, conf.principal, configConverter)
  }

  private val converters: List[HttpMessageConverter[_]] = {
    List (
      new ByteArrayHttpMessageConverter,
      new StringHttpMessageConverter,
      new ResourceHttpMessageConverter,
      new SourceHttpMessageConverter,
      new AllEncompassingFormHttpMessageConverter,
      gsonConverter
    )
  }
}
