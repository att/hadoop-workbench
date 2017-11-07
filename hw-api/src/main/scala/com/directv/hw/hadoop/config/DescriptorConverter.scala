package com.directv.hw.hadoop.config

import com.directv.hw.hadoop.template.model.ComponentDescriptor

trait DescriptorConverter {
  def parse(descriptor: String): ComponentDescriptor
  def marshall(descriptor: ComponentDescriptor): String
}
