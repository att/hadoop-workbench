package com.directv.hw.hadoop.hdfs.exception;

public class HdfsFileNotFoundException extends HdfsAccessException {
    public HdfsFileNotFoundException(String path, String user, String message, Exception e) {
        super(path, user, message, e);
    }

    public HdfsFileNotFoundException(String path, String user, Exception e) {
        this(path, user, "\"" + path + "\" not found", e);
    }
}
