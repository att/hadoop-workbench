package com.directv.hw.hadoop.oozie.parser

import java.io.InputStream

import com.directv.hw.common.io.DapIoUtils._
import com.directv.hw.hadoop.oozie.model.WorkflowInfo
import com.directv.hw.hadoop.oozie.service.WorkflowParser
import com.typesafe.scalalogging.LazyLogging
import resource.Resource

import scala.annotation.tailrec
import scala.io.Source
import scala.language.postfixOps
import scala.xml.MetaData
import scala.xml.pull._

class WorkflowParserImpl extends WorkflowParser with LazyLogging {
  private val workflowHeader = "workflow-app"
  private val workflowNameAttr = "name"
  private val WfNsPattern = """(.*\"uri:oozie:workflow:)(\d[.\d]*)(\".*)""".r

  def getWorkflowInfoFromFile(path: String): Option[WorkflowInfo] = parseXmlSource(Source.fromFile(path))
  def getWorkflowInfoFromStream(stream: InputStream): Option[WorkflowInfo] = parseXmlSource(Source.fromInputStream(stream))
  def getWorkflowInfoFromString(string: String): Option[WorkflowInfo] = parseXmlSource(Source.fromString(string))
  def getWorkflowInfoFromSource(source: Source): Option[WorkflowInfo] = parseXmlSource(source)
  
  implicit def eventReaderResource[A <: XMLEventReader]: Resource[A] = new Resource[A] {
    override def close(r: A): Unit = r.stop()
    override def closeAfterException(r: A, t: Throwable): Unit = r.stop()
  }

  private def parseXmlSource(source: => Source): Option[WorkflowInfo] = {
    managedOpt(source, "Could not extract workflow info")({ source =>
      managed2(new XMLEventReader(source)) { xmlReader =>

        @tailrec
        def iterateXml: Option[WorkflowInfo] = {
          if (xmlReader.hasNext) {
            xmlReader.next() match {
              case EvElemStart(_, label, attrs, scope) =>
                if (workflowHeader.equals(label)) {
                  val workflowName = retrieveWorkflowName(attrs)
                  scope.toString() match {
                    case WfNsPattern(_, version, _) =>
                      Some(WorkflowInfo(workflowName, version, workflowName))
                    case _ =>
                      None
                  }
                } else {
                  iterateXml
                }
              case _ => iterateXml
            }
          } else {
            None
          }
        }

        iterateXml
      }
    }) flatten
  }

  private def retrieveWorkflowName(attrs: MetaData): String = attrs.get(workflowNameAttr) match {
    case Some(attr) => attr.toString()
    case None => ""
  }
}
