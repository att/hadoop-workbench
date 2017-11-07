package com.directv.hw.web.listing.plugin

import com.directv.hw.hadoop.access.{KeyFile, KeyFileInfo}
import com.directv.hw.web.listing.model.KeyFileWO

trait PlatformWebConverter {
  def toWeb(key: KeyFileInfo) = KeyFileWO(Some(key.id), key.name)
  def toWeb(key: KeyFile) = KeyFileWO(key.id, key.name)
}
