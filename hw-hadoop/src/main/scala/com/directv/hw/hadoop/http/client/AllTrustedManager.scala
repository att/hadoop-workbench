package com.directv.hw.hadoop.http.client

import java.security.cert.X509Certificate
import javax.net.ssl.X509TrustManager

class AllTrustedManager extends X509TrustManager {
  override def getAcceptedIssuers = new Array[X509Certificate](0)
  override def checkClientTrusted(x509Certificates: Array[X509Certificate], s: String) = {}
  override def checkServerTrusted(x509Certificates: Array[X509Certificate], s: String) = {}
}
