package com.directv.hw.web.admin.model

case class WebMenuSettings(disabled: List[String])
case class WebMenuResponse(menu: WebMenuSettings)
case class OngoingRequest(url: String, time: Long)
case class OngoingRequestList(requests: List[OngoingRequest])