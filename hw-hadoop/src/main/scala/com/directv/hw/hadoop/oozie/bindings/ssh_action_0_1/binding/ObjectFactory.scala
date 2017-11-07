// JAXB

package com.directv.hw.hadoop.oozie.bindings.ssh_action_0_1.binding

import javax.xml.bind.JAXBElement
import javax.xml.bind.annotation.{XmlElementDecl, XmlRegistry}
import javax.xml.namespace.QName


@XmlRegistry object ObjectFactory {
  private val _Ssh_QNAME: QName = new QName("uri:oozie:ssh-action:0.1", "ssh")
}

@XmlRegistry class ObjectFactory {


  def createACTION: ACTION = new ACTION


  def createFLAG: FLAG = new FLAG


  @XmlElementDecl(namespace = "uri:oozie:ssh-action:0.1", name = "ssh")
  def createSsh(value: ACTION): JAXBElement[ACTION] = new JAXBElement[ACTION](ObjectFactory._Ssh_QNAME, classOf[ACTION], null, value)
}
