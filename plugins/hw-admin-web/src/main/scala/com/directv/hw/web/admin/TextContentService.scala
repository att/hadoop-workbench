package com.directv.hw.web.admin

import com.directv.hw.common.web.ContentServiceBase
import com.directv.hw.core.exception.NotSupportedException
import com.directv.hw.core.service.Overwrite
import com.directv.hw.hadoop.files.{ComponentFS, LocalFsFactory}
import com.directv.hw.hadoop.model.{FileContent, ParsedContent}
import scaldi.{Injectable, Injector}

class TextContentService(dir: String, user: String)(implicit injector: Injector)
  extends ContentServiceBase with Injectable {

  private val localFsFactory = inject[LocalFsFactory]

  protected lazy val fileService: ComponentFS = localFsFactory.getLocalFs(dir)

  override def saveFileContent(file: String, content: FileContent, overwrite: Overwrite): Unit = {
    if (content.text.isEmpty) nse("file content without text field")
    fileService.saveFileContent(file, content.text.get, Overwrite.OVERWRITE)
  }

  override def getFileContent(file: String, format: Option[String]): FileContent = {
    if (format.isDefined) nse(s"format [${format.get}] is not supported currently")
    val text = fileService.getFileContent(file)
    FileContent(text = Some(text))
  }

  override def convert(file: String, text: String, format: String): ParsedContent = nse("not supported")

  override def convert(file: String, content: ParsedContent): String = nse("not supported")

  private def nse(message: String = "") = throw new NotSupportedException(message)
}
