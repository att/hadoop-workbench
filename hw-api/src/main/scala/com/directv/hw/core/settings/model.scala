package com.directv.hw.core.settings

case class UserSettings(user: String,
                        settings: String,
                        hdfsUserId: Option[Int] = None,
                        oozieUserId: Option[Int] = None,
                        localUserAsService: Boolean = false)

case class UserState(user: String, state: String)

case class Users(users: List[String])
case class UserRoles(roles: List[String])
case class UserRoleAssignment(user: String, roles: List[String])
case class UsersRoleAssignments(assignments: List[UserRoleAssignment])
