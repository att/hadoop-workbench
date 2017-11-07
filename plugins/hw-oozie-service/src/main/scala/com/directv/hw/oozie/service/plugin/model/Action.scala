package com.directv.hw.oozie.service.plugin.model

case class Action(id: String,
                   name: String,
                   `type`: String,
                   startTime: String,
                   endTime: String,
                   externalId: String,
                   status: String,
                   transition: String,
                   errorCode: String,
                   errorMessage: String,
                   retries: Int)
