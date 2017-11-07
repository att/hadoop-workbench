// JAXB

package com.directv.hw.hadoop.oozie.bindings.distcp_action_0_2.binding

import javax.xml.bind.JAXBElement
import javax.xml.bind.annotation.{XmlElementDecl, XmlRegistry}
import javax.xml.namespace.QName


@XmlRegistry object ObjectFactory {
  private val _Distcp_QNAME: QName = new QName("uri:oozie:distcp-action:0.2", "distcp")
}

@XmlRegistry class ObjectFactory {


  def createCONFIGURATION: CONFIGURATION =  new CONFIGURATION


  def createACTION: ACTION =  new ACTION


  def createPREPARE: PREPARE =  new PREPARE


  def createDELETE: DELETE = new DELETE


  def createMKDIR: MKDIR = new MKDIR


  def createCONFIGURATIONProperty: CONFIGURATION.Property =  new CONFIGURATION.Property


  @XmlElementDecl(namespace = "uri:oozie:distcp-action:0.2", name = "distcp") def createDistcp(value: ACTION): JAXBElement[ACTION] =
     new JAXBElement[ACTION](ObjectFactory._Distcp_QNAME, classOf[ACTION], null, value)
}
