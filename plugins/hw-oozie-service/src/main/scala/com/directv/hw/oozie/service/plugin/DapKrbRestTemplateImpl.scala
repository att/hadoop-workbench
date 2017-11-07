package com.directv.hw.oozie.service.plugin

import org.springframework.security.extensions.kerberos.client.KerberosRestTemplate
import org.springframework.web.client.RestTemplate
import scala.collection.JavaConverters._

class DapKrbRestTemplateImpl(keytabPath: String, principal: String, options: Map[String, AnyRef])
  extends KerberosRestTemplate(keytabPath, principal, options.asJava) with DapRestTemplate

class DapRestTemplateImpl extends RestTemplate with DapRestTemplate
