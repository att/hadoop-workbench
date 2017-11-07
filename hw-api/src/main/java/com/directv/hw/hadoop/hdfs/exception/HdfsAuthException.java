package com.directv.hw.hadoop.hdfs.exception;

public class HdfsAuthException extends HdfsAccessException {
    public HdfsAuthException(String path, String user, String message, Exception e) {
        super(path, user, message, e);
    }

    public HdfsAuthException(String path, String user, Exception e) {
        super(path, user, "Auth failed for hdfs path " + path + " and user " + user, e);
    }
}
