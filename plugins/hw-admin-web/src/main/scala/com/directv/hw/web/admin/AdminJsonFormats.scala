package com.directv.hw.web.admin

import com.directv.hw.common.web.{CommonJsonFormats, FilesRouteFormats}
import com.directv.hw.core.settings.{UserRoleAssignment, UserRoles, Users, UsersRoleAssignments}
import com.directv.hw.web.admin.model.{OngoingRequest, OngoingRequestList, WebMenuResponse, WebMenuSettings}

trait AdminJsonFormats extends CommonJsonFormats with FilesRouteFormats {
  implicit val menuInstructionFormat = jsonFormat1(WebMenuSettings)
  implicit val menuResponseFormat = jsonFormat1(WebMenuResponse)
  implicit val ongoingRequestFormat = jsonFormat2(OngoingRequest)
  implicit val ongoingRequestListFormat = jsonFormat1(OngoingRequestList)
  implicit val usersFormat = jsonFormat1(Users)
  implicit val userRolesFormat = jsonFormat1(UserRoles)
  implicit val userRoleAssignment = jsonFormat2(UserRoleAssignment)
  implicit val userRoleAssignments = jsonFormat1(UsersRoleAssignments)
}
