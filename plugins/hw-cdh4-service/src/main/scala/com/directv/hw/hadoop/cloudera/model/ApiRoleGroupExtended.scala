package com.directv.hw.hadoop.cloudera.model

import javax.xml.bind.annotation.{XmlTransient, XmlElement}

import com.cloudera.api.model.ApiRoleConfigGroup

// TODO (vkolischuk) workaround for Cloudera 4 to suppress isBase property in POST and PUT requests
class ApiRoleGroupExtended extends ApiRoleConfigGroup {
  @XmlTransient
  override def isBase = super.isBase
}
