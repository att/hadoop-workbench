package com.directv.hw.core.service

import com.directv.hw.hadoop.files.{ComponentFS, LocalFsFactory}

class LocalFsFactoryImpl extends LocalFsFactory {

  override def getLocalFs(dir: String): ComponentFS = {
    new ComponentLocalFS(dir)
  }
}
