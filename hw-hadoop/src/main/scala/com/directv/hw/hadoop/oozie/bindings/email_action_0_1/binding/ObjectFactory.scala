// JAXB

package com.directv.hw.hadoop.oozie.bindings.email_action_0_1.binding

import javax.xml.bind.JAXBElement
import javax.xml.bind.annotation.{XmlElementDecl, XmlRegistry}
import javax.xml.namespace.QName


@XmlRegistry object ObjectFactory {
  private val _Email_QNAME: QName = new QName("uri:oozie:email-action:0.1", "email")
}

@XmlRegistry class ObjectFactory {

  def createACTION: ACTION = new ACTION


  @XmlElementDecl(namespace = "uri:oozie:email-action:0.1", name = "email") def createEmail(value: ACTION): JAXBElement[ACTION] =
     new JAXBElement[ACTION](ObjectFactory._Email_QNAME, classOf[ACTION], null, value)

}
