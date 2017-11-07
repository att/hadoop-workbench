package com.directv.hw.hadoop.oozie.converter

import com.directv.hw.hadoop.di.OozieModule
import com.directv.hw.hadoop.oozie.service.{ConversionOptions, OozieFilesConverter}
import com.typesafe.scalalogging.LazyLogging
import org.scalamock.scalatest.MockFactory
import org.scalatest.prop.TableDrivenPropertyChecks._
import org.scalatest.{FlatSpec, Matchers}
import scaldi.Injectable

import scala.xml._


class OozieConvertersSpec extends FlatSpec with Matchers with MockFactory with Injectable with LazyLogging {

  def topNamespaces(node: Node, parentNs: String = "-#-"): Node = {
    node match {
      case elem: Elem ⇒
        elem.copy(
          scope = TopScope,
          prefix = null,
          attributes = {
            if (elem.namespace != parentNs) new UnprefixedAttribute("xmlns", elem.namespace, removeNamespacesFromAttributes(elem.attributes.filter(_.value.toString() != "")))
            else removeNamespacesFromAttributes(elem.attributes.filter(_.value.toString() != ""))
          },
          child = elem.child.map(c⇒ topNamespaces(c, elem.namespace))
          //        child = elem.child.collect{case c: Node if deepNonEmpty(c) ⇒ topNamespaces(c, elem.namespace)}
        )
      case other => other
    }
  }

  def deepNonEmpty(node: Node): Boolean = {
    if (node.attributes.nonEmpty || node.text.trim.nonEmpty) true
    else
    if (node.attributes.isEmpty && node.child.isEmpty) false
    else
      node.child.exists(childNode ⇒ deepNonEmpty(childNode))
  }

  def removeNamespaces(node: Node): Node = {
    node match {
      case elem: Elem =>
        elem.copy(
          scope = TopScope,
          prefix = null,
          attributes = new UnprefixedAttribute("gen_xmlns", node.namespace, removeNamespacesFromAttributes(elem.attributes)),
          child = elem.child.map(removeNamespaces)
        )
      case other => other
    }
  }

  def removeNamespacesFromAttributes(metadata: MetaData): MetaData = {
    metadata match {
      case UnprefixedAttribute(k, v, n) => new UnprefixedAttribute(k, v, removeNamespacesFromAttributes(n))
      case PrefixedAttribute(pre, k, v, n) => new UnprefixedAttribute(k, v, removeNamespacesFromAttributes(n))
      case Null => Null
    }
  }

  val xmlResources = Table (
    ("path", "version"), // First tuple defines column names
    ("testWorkflow1.xml", "0.4"), // Subsequent tuples define the data
    ("testWorkflow2.xml", "0.4"),
    ("testWorkflow3.xml", "0.5"),
    ("testWorkflow4.xml", "0.4"),
    ("testWorkflow5.xml", "0.4"),
    ("testWorkflow6.xml", "0.4"),
    ("testWorkflow7.xml", "0.4"),
    ("testWorkflow8.xml", "0.4"),
    ("testWorkflow9.xml", "0.4"),
    ("testWorkflow10.xml", "0.4"),
    ("testWorkflow11.xml", "0.1"),
    ("testWorkflow12.xml", "0.3")
  )

  "converter" should "convert xml(a)->json(b)->xml(c); (a) should equal to (c)" in {
    def readAsString(path: String) = scala.io.Source.fromURL(getClass.getResource(path)).mkString

    implicit val context = OozieModule
    val filesConverter = inject[OozieFilesConverter]

    forAll(xmlResources) {
      (path: String, version: String) ⇒
        logger.info(s"processing [$path]")

        val workflowSrc = readAsString(path)

        val graph = filesConverter.parseWorkflowXml(workflowSrc)

        val workflowResult = filesConverter.marshalWorkflowGraph(graph, ConversionOptions(isStrict = true))

        val srcXml = Utility.sort(Utility.trim(topNamespaces(XML.loadString(workflowSrc))))
        val resXml = Utility.sort(Utility.trim(topNamespaces(XML.loadString(workflowResult))))
        logger.info(s"comparing [$path]")
        resXml should equal(srcXml)
        logger.info(s"success: [$path]")
    }

  }

}
