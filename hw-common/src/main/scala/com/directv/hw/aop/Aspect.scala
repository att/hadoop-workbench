package com.directv.hw.aop

import java.lang.reflect.{InvocationHandler, InvocationTargetException, Method, Proxy}

object Aspect {
  def createProxy[I, C <: I](proxee: C)(handler: C => InvocationHandler): I = {
    Proxy.newProxyInstance (
      proxee.getClass.getClassLoader,
      proxee.getClass.getInterfaces,
      handler(proxee)
    ).asInstanceOf[I]
  }
}


class Aspect(proxee: Any) extends InvocationHandler {
  override def invoke(proxy: scala.Any, method: Method, args: Array[AnyRef]): AnyRef = {
    try {
      method.invoke(proxee, args: _*)
    } catch {
      case e: InvocationTargetException => throw e.getCause
    }
  }
}