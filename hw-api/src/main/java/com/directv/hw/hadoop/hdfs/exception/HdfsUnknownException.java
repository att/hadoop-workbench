package com.directv.hw.hadoop.hdfs.exception;

public class HdfsUnknownException extends HdfsAccessException {
    public HdfsUnknownException(String path, String user, String message, Throwable e) {
        super(path, user, message, e);
    }
}
