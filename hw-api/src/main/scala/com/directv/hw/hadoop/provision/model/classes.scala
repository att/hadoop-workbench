package com.directv.hw.hadoop.provision.model

case class ProvisionUrl(title: String, url: String, `type`: String)
case class ProvisionUrls(urls: List[ProvisionUrl])
