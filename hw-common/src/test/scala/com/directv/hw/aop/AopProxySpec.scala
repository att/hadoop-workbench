package com.directv.hw.aop

import java.lang.reflect.{InvocationHandler, Method}

import org.scalatest.{FlatSpec, Matchers}

class AopProxySpec extends FlatSpec with Matchers {

  class TestClass extends Test {
    def test() = hello()
    private def hello() = println("hello")
  }

  trait Test {
    def test(): Unit
  }

  trait LoggingAspect extends InvocationHandler {
    abstract override def invoke(proxy: scala.Any, method: Method, args: Array[AnyRef]): AnyRef = {
      println(s"before ${method.getName}")
      val result = super.invoke(proxy, method, args)
      println(s"after ${method.getName}")
      result
    }
  }

  "interceptor" should "logg method" in {
    val test: Test = Aspect.createProxy(new TestClass())(new Aspect(_) with LoggingAspect)
    test.test()
  }
}
