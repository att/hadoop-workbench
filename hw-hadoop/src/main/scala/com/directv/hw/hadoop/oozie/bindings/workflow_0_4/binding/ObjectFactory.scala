// JAXB

package com.directv.hw.hadoop.oozie.bindings.workflow_0_4.binding

import javax.xml.bind.JAXBElement
import javax.xml.bind.annotation.{XmlElementDecl, XmlRegistry}
import javax.xml.namespace.QName


@XmlRegistry object ObjectFactory {
  private val _Kill_QNAME: QName = new QName("uri:oozie:workflow:0.4", "kill")
  private val _Switch_QNAME: QName = new QName("uri:oozie:workflow:0.4", "switch")
  private val _Pig_QNAME: QName = new QName("uri:oozie:workflow:0.4", "pig")
  private val _WorkflowApp_QNAME: QName = new QName("uri:oozie:workflow:0.4", "workflow-app")
  private val _Fs_QNAME: QName = new QName("uri:oozie:workflow:0.4", "fs")
  private val _SubWorkflow_QNAME: QName = new QName("uri:oozie:workflow:0.4", "sub-workflow")
  private val _Java_QNAME: QName = new QName("uri:oozie:workflow:0.4", "java")
  private val _MapReduce_QNAME: QName = new QName("uri:oozie:workflow:0.4", "map-reduce")
}

@XmlRegistry class ObjectFactory {

  def createCREDENTIAL: CREDENTIAL = new CREDENTIAL

  def createCONFIGURATION: CONFIGURATION = new CONFIGURATION

  def createPARAMETERS: PARAMETERS = new PARAMETERS

  def createWORKFLOWAPP: WORKFLOWAPP = new WORKFLOWAPP

  def createFS: FS = new FS

  def createSUBWORKFLOW: SUBWORKFLOW = new SUBWORKFLOW

  def createKILL: KILL = new KILL

  def createJAVA: JAVA = new JAVA

  def createSWITCH: SWITCH = new SWITCH

  def createMAPREDUCE: MAPREDUCE = new MAPREDUCE

  def createPIG: PIG = new PIG

  def createSTREAMING: STREAMING = new STREAMING

  def createPREPARE: PREPARE = new PREPARE

  def createDEFAULT: DEFAULT = new DEFAULT

  def createCASE: CASE = new CASE

  def createPIPES: PIPES = new PIPES

  def createDELETE: DELETE = new DELETE

  def createJOIN: JOIN = new JOIN

  def createACTION: ACTION = new ACTION

  def createFLAG: FLAG = new FLAG

  def createTOUCHZ: TOUCHZ = new TOUCHZ

  def createFORKTRANSITION: FORKTRANSITION = new FORKTRANSITION

  def createACTIONTRANSITION: ACTIONTRANSITION = new ACTIONTRANSITION

  def createMKDIR: MKDIR = new MKDIR

  def createMOVE: MOVE = new MOVE

  def createFORK: FORK = new FORK

  def createCREDENTIALS: CREDENTIALS = new CREDENTIALS

  def createSTART: START = new START

  def createDECISION: DECISION = new DECISION

  def createCHMOD: CHMOD = new CHMOD

  def createEND: END = new END

  def createGLOBAL: GLOBAL = new GLOBAL

  def createCREDENTIALProperty: CREDENTIAL.Property = new CREDENTIAL.Property

  def createCONFIGURATIONProperty: CONFIGURATION.Property = new CONFIGURATION.Property

  def createPARAMETERSProperty: PARAMETERS.Property = new PARAMETERS.Property

  @XmlElementDecl(namespace = "uri:oozie:workflow:0.4", name = "kill") def createKill(value: KILL): JAXBElement[KILL] = new JAXBElement[KILL](ObjectFactory._Kill_QNAME, classOf[KILL], null, value)

  @XmlElementDecl(namespace = "uri:oozie:workflow:0.4", name = "switch") def createSwitch(value: SWITCH): JAXBElement[SWITCH] = new
      JAXBElement[SWITCH](ObjectFactory._Switch_QNAME, classOf[SWITCH], null, value)

  @XmlElementDecl(namespace = "uri:oozie:workflow:0.4", name = "pig") def createPig(value: PIG): JAXBElement[PIG] = new JAXBElement[PIG] (ObjectFactory._Pig_QNAME, classOf[PIG], null, value)

  @XmlElementDecl(namespace = "uri:oozie:workflow:0.4", name = "workflow-app") def createWorkflowApp(value: WORKFLOWAPP): JAXBElement[WORKFLOWAPP]
  = new JAXBElement[WORKFLOWAPP](ObjectFactory._WorkflowApp_QNAME, classOf[WORKFLOWAPP], null, value)

  @XmlElementDecl(namespace = "uri:oozie:workflow:0.4", name = "fs") def createFs(value: FS): JAXBElement[FS] = new JAXBElement[FS](ObjectFactory
    ._Fs_QNAME, classOf[FS], null, value)

  @XmlElementDecl(namespace = "uri:oozie:workflow:0.4", name = "sub-workflow") def createSubWorkflow(value: SUBWORKFLOW): JAXBElement[SUBWORKFLOW]
  = new JAXBElement[SUBWORKFLOW](ObjectFactory._SubWorkflow_QNAME, classOf[SUBWORKFLOW], null, value)

  @XmlElementDecl(namespace = "uri:oozie:workflow:0.4", name = "java") def createJava(value: JAVA): JAXBElement[JAVA] = new JAXBElement[JAVA] (ObjectFactory._Java_QNAME, classOf[JAVA], null, value)

  @XmlElementDecl(namespace = "uri:oozie:workflow:0.4", name = "map-reduce") def createMapReduce(value: MAPREDUCE): JAXBElement[MAPREDUCE] =
    new JAXBElement[MAPREDUCE](ObjectFactory._MapReduce_QNAME, classOf[MAPREDUCE], null, value)
}
