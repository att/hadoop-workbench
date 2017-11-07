package com.directv.hw.hadoop.oozie.parser

import com.directv.hw.core.exception.ParseException
import com.directv.hw.hadoop.oozie.model.AppInfo
import com.directv.hw.hadoop.oozie.service.CoordinatorParser
import com.typesafe.scalalogging.LazyLogging
import resource.Resource

import scala.annotation.tailrec
import scala.io.Source
import scala.language.postfixOps
import scala.xml.MetaData
import scala.xml.pull._
import resource._

class CoordinatorParserImpl extends CoordinatorParser with LazyLogging {
  private val coordinatorHeader = "coordinator-app"
  private val workflowNameAttr = "name"
  private val WfNsPattern = """(.*\"uri:oozie:coordinator:)(\d[.\d]*)(\".*)""".r

  implicit def eventReaderResource[A <: XMLEventReader]: Resource[A] = new Resource[A] {
    override def close(r: A): Unit = r.stop()
    override def closeAfterException(r: A, t: Throwable): Unit = r.stop()
  }

  override def parseInfo(xml: String): AppInfo = {
    parseXmlSource(Source.fromString(xml)).getOrElse {
      throw new ParseException("Could not extract name and version from coordinator.xml")
    }
  }

  private def parseXmlSource(source: => Source): Option[AppInfo] = {
    managed(source).acquireAndGet{ source =>
      managed(new XMLEventReader(source)).acquireAndGet { xmlReader =>

        @tailrec
        def iterateXml: Option[AppInfo] = {
          if (xmlReader.hasNext) {
            xmlReader.next() match {
              case EvElemStart(_, label, attrs, scope) =>
                if (coordinatorHeader.equals(label)) {
                  val workflowName = retrieveWorkflowName(attrs)
                  scope.toString() match {
                    case WfNsPattern(_, version, _) =>
                      Some(AppInfo(workflowName, version))
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
    }
  }

  private def retrieveWorkflowName(attrs: MetaData): String = attrs.get(workflowNameAttr) match {
    case Some(attr) => attr.toString()
    case None => ""
  }
}
