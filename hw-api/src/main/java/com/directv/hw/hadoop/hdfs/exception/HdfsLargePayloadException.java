package com.directv.hw.hadoop.hdfs.exception;

public class HdfsLargePayloadException extends HdfsAccessException {
    public HdfsLargePayloadException(String path, String user, String message, Exception e) {
        super(path, user, message, e);
    }
}
