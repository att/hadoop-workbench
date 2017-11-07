package com.directv.hw.hadoop.model;

public class OoziePath extends ModulePath {

    public static final String HDFS_SERVICE_ID = "HDFS";

    public OoziePath(int platformId, String clusterId, String moduleId) {
        super(platformId, clusterId, HDFS_SERVICE_ID, moduleId);
    }
}
