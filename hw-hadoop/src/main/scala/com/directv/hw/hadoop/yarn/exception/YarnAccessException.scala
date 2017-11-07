package com.directv.hw.hadoop.yarn.exception

import com.directv.hw.core.exception.AccessException

class YarnAccessException(message: String = "", cause: Throwable = null) extends AccessException(message, cause)
