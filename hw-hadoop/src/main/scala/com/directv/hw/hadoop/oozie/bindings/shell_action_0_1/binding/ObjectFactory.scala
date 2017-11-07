// JAXB

package com.directv.hw.hadoop.oozie.bindings.shell_action_0_1.binding

import javax.xml.bind.JAXBElement
import javax.xml.bind.annotation.{XmlElementDecl, XmlRegistry}
import javax.xml.namespace.QName


@XmlRegistry object ObjectFactory {
  private val _Shell_QNAME: QName = new QName("uri:oozie:shell-action:0.1", "shell")
}

@XmlRegistry class ObjectFactory {


  def createCONFIGURATION: CONFIGURATION = new CONFIGURATION


  def createACTION: ACTION = new ACTION


  def createPREPARE: PREPARE = new PREPARE


  def createDELETE: DELETE = new DELETE


  def createMKDIR: MKDIR = new MKDIR


  def createFLAG: FLAG = new FLAG


  def createCONFIGURATIONProperty: CONFIGURATION.Property = new CONFIGURATION.Property


  @XmlElementDecl(namespace = "uri:oozie:shell-action:0.1", name = "shell") def createShell(value: ACTION): JAXBElement[ACTION] =
    new JAXBElement[ACTION](ObjectFactory._Shell_QNAME, classOf[ACTION], null, value)
}
