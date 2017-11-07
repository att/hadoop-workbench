package com.directv.hw.hadoop.cloudera

case class ClouderaConnectionData(host: String,
                                  port: Int,
                                  tlsEnabled: Boolean,
                                  userName: String,
                                  password: String,
                                  connetionTimeoutMs: Int,
                                  receivingTimeoutMs: Int)
