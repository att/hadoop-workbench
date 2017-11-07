// JAXB

package com.directv.hw.hadoop.oozie.bindings.hive_action_0_4.binding

import javax.xml.bind.JAXBElement
import javax.xml.bind.annotation.{XmlElementDecl, XmlRegistry}
import javax.xml.namespace.QName


@XmlRegistry object ObjectFactory {
  private val _Hive_QNAME: QName = new QName("uri:oozie:hive-action:0.4", "hive")
}

@XmlRegistry class ObjectFactory {


  def createCONFIGURATION: CONFIGURATION = new CONFIGURATION


  def createACTION: ACTION = new ACTION


  def createPREPARE: PREPARE = new PREPARE


  def createDELETE: DELETE = new DELETE


  def createMKDIR: MKDIR = new MKDIR


  def createCONFIGURATIONProperty: CONFIGURATION.Property =
    new CONFIGURATION.Property


  @XmlElementDecl(namespace = "uri:oozie:hive-action:0.4", name = "hive") def createHive(value: ACTION): JAXBElement[ACTION] =
     new JAXBElement[ACTION](ObjectFactory._Hive_QNAME, classOf[ACTION], null, value)

}
