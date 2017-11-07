package com.directv.hw.hadoop.files

trait LocalFsFactory {
  def getLocalFs(dir: String): ComponentFS
}
