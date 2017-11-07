package com.directv.hw.web.provision

import com.directv.hw.common.web.CommonJsonFormats
import com.directv.hw.hadoop.provision.model.ProvisionUrl
import com.directv.hw.hadoop.provision.model.ProvisionUrls

trait JsonFormats extends CommonJsonFormats  {
  implicit val urlFormat = jsonFormat3(ProvisionUrl)
  implicit val urlsFormat = jsonFormat1(ProvisionUrls)
}
