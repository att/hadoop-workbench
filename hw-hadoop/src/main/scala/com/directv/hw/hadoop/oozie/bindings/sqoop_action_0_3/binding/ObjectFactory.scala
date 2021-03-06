// JAXB

package com.directv.hw.hadoop.oozie.bindings.sqoop_action_0_3.binding

import javax.xml.bind.JAXBElement
import javax.xml.bind.annotation.{XmlElementDecl, XmlRegistry}
import javax.xml.namespace.QName


@XmlRegistry object ObjectFactory {
  private val _Sqoop_QNAME: QName = new QName("uri:oozie:sqoop-action:0.3", "sqoop")
}

@XmlRegistry class ObjectFactory {


  def createCONFIGURATION: CONFIGURATION = new CONFIGURATION


  def createACTION: ACTION = new ACTION


  def createPREPARE: PREPARE = new PREPARE


  def createDELETE: DELETE = new DELETE


  def createMKDIR: MKDIR =  new MKDIR


  def createCONFIGURATIONProperty: CONFIGURATION.Property =  new CONFIGURATION.Property


  @XmlElementDecl(namespace = "uri:oozie:sqoop-action:0.3", name = "sqoop") def createSqoop(value: ACTION): JAXBElement[ACTION] =
    new JAXBElement[ACTION](ObjectFactory._Sqoop_QNAME, classOf[ACTION], null, value)

}
