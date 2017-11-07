package com.directv.hw.common.io

import java.io.BufferedReader

import scala.annotation.tailrec

object SimpleLogParser {
  def toEntries(reader: BufferedReader): Iterator[String] = {
    new Iterator[String] {
      private var nextLine: String = null
      private var isEndOfStream: Boolean = false

      def hasNext = {
        fetchNextLine()
        !isEndOfStream
      }

      def next() = {
        readEntry(readNextLine())
      }

      @tailrec
      private def readEntry(collected: String): String = {
        fetchNextLine()
        if (hasNext && shouldMerge(nextLine)) {
          val nextCollected = s"$collected\n${readNextLine()}"
          readEntry(nextCollected)
        } else {
          collected
        }
      }

      private def shouldMerge(line: String) = {
        !(line matches "^[0-9\\[].*")
      }

      private def fetchNextLine() = {
        if (nextLine == null) {
          if (!isEndOfStream) {
            nextLine = reader.readLine()
            if (nextLine == null) {
              isEndOfStream = true
            }
          }
        }
      }

      private def readNextLine() = {
        val result = nextLine
        nextLine = null
        result
      }
    }
  }
}
