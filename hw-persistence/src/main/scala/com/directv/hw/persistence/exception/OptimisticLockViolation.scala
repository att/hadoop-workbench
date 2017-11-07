package com.directv.hw.persistence.exception

case class OptimisticLockViolation(message: String = "") extends Exception(message)
