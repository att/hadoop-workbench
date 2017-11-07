package com.directv.hw.core.web

import akka.actor.ActorRef

object WebSocket {
  case class SessionOpened(path: String, token: String)
  case class SessionClosed(code: Int = 1000)
  case class SessionError(message: String)
  case class RegisterHandler(handler: ActorRef)
  case class ClientTextMesage(message: String)
  case class ServerTextMesage(message: String)
  case class ConnectionOpened(connection: ActorRef)
  case class ConnectionClosed(connection: ActorRef)
  case class Close(code: Int = 1000)
}
