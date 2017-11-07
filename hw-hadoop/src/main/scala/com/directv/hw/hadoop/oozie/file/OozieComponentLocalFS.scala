package com.directv.hw.hadoop.oozie.file

import com.directv.hw.hadoop.files.ComponentFS

object OozieComponentLocalFS {
  def apply(fs: ComponentFS) = OozieComponentFS(fs)
}
