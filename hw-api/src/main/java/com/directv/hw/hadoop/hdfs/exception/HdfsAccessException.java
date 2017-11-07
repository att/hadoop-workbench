package com.directv.hw.hadoop.hdfs.exception;

public class HdfsAccessException extends RuntimeException {
    private final String path;
    private final String user;

    public HdfsAccessException(String path, String user, String message, Throwable e) {
        super(message, e);
        this.path = path;
        this.user = user;
    }

    public String getPath() {return path;}
    public String getUser() {return user;}
}
