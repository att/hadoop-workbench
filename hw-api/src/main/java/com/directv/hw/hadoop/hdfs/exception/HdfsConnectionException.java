package com.directv.hw.hadoop.hdfs.exception;

public class HdfsConnectionException extends HdfsAccessException {
    public HdfsConnectionException(String path, String user, String message, Exception e) {
        super(path, user, message, e);
    }
}
