package com.directv.hw.hadoop.hdfs.exception;

public class HdfsAlreadyExistsException extends HdfsAccessException {
    public HdfsAlreadyExistsException(String path, String user, String message, Exception e) {
        super(path, user, message, e);
    }

    public HdfsAlreadyExistsException(String path, String user, Exception e) {
        this(path, user, "File " + path + " already exists", e);
    }
}
