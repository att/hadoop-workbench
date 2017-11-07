package com.directv.hw.hadoop.hdfs.exception;

public class HdfsPermissionException extends HdfsAccessException {
    public HdfsPermissionException(String path, String user, String message, Exception e) {
        super(path, user, message, e);
    }
    public HdfsPermissionException(String path, String user, Exception e) {
        this(path, user, "Permission denied for path " + path + " and user " + user, e);
    }
}
